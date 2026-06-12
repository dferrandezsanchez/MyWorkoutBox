import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../../types/domain';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

export interface LoginResponse {
  token: string;
  user: PublicUser;
  tenant: PublicTenant;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  organizationId: string;
}

export interface PublicTenant {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  appName: string;
  shortName: string;
  mark: string;
  claim: string;
  description: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
}

export interface TenantOption {
  id: string;
  organizationId: string;
  name: string;
  organizationName: string;
  role: Role;
}

export interface TenantSelectionResponse {
  tenantSelectionRequired: true;
  selectionToken: string;
  tenants: TenantOption[];
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateTenantInput {
  name?: string;
  appName?: string;
  shortName?: string;
  mark?: string;
  claim?: string;
  description?: string;
  primary?: string;
  primaryHover?: string;
  primarySoft?: string;
}

type LoginResult = LoginResponse | TenantSelectionResponse;
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_TENANT_BRAND = {
  claim: 'Training Intelligence',
  description: 'Gestión de clientes, entrenadores, ejercicios y marcas.',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primarySoft: '#93C5FD',
};

function normalizeHexColor(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && HEX_COLOR_RE.test(normalized) ? normalized : fallback;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Error interno del servidor', 500);
  }
  return secret;
}

function signTenantToken(userId: string, tenantId: string, organizationId: string, role: Role): string {
  return jwt.sign(
    { sub: userId, tenantId, organizationId, role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' } as jwt.SignOptions
  );
}

function signSelectionToken(userId: string): string {
  return jwt.sign(
    { sub: userId, purpose: 'tenant-selection' },
    getJwtSecret(),
    { expiresIn: '10m' } as jwt.SignOptions
  );
}

async function buildLoginResponse(user: { id: string; name: string; email: string }, tenantId: string): Promise<LoginResponse> {
  const membership = await prisma.userTenantMembership.findFirst({
    where: {
      userId: user.id,
      tenantId,
      active: true,
      tenant: { active: true, organization: { active: true } },
    },
    include: { tenant: true },
  });

  if (!membership) {
    throw new AppError('Tenant no disponible', 403);
  }

  const role = membership.role as Role;
  const tenant = membership.tenant;
  const token = signTenantToken(user.id, tenant.id, tenant.organizationId, role);

  return {
    token,
    tenant: {
      id: tenant.id,
      organizationId: tenant.organizationId,
      name: tenant.name,
      slug: tenant.slug,
      appName: tenant.appName,
      shortName: tenant.shortName,
      mark: tenant.mark,
      claim: tenant.claim,
      description: tenant.description,
      primary: tenant.primary,
      primaryHover: tenant.primaryHover,
      primarySoft: tenant.primarySoft,
    },
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      tenantId: tenant.id,
      organizationId: tenant.organizationId,
    },
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use a constant-time check even when user is not found to avoid timing attacks
  const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatch) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  if (!user.active) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const memberships = await prisma.userTenantMembership.findMany({
    where: {
      userId: user.id,
      active: true,
      tenant: { active: true, organization: { active: true } },
    },
    include: {
      tenant: {
        include: { organization: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (memberships.length === 0) {
    throw new AppError('No tienes acceso a ningún centro activo', 403);
  }

  if (memberships.length === 1) {
    return buildLoginResponse(user, memberships[0].tenantId);
  }

  return {
    tenantSelectionRequired: true,
    selectionToken: signSelectionToken(user.id),
    tenants: memberships.map((membership) => ({
      id: membership.tenant.id,
      organizationId: membership.tenant.organizationId,
      name: membership.tenant.name,
      organizationName: membership.tenant.organization.name,
      role: membership.role as Role,
    })),
  };
}

export async function selectTenant(selectionToken: string, tenantId: string): Promise<LoginResponse> {
  try {
    const payload = jwt.verify(selectionToken, getJwtSecret()) as { sub: string; purpose?: string };
    if (payload.purpose !== 'tenant-selection') {
      throw new AppError('Token de selección inválido', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    return buildLoginResponse(user, tenantId);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Token de selección inválido', 401);
  }
}

export async function getMe(userId: string, tenantId: string, organizationId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Recurso no encontrado', 404);
  }

  const membership = await prisma.userTenantMembership.findFirst({
    where: {
      userId,
      tenantId,
      active: true,
      tenant: { active: true, organization: { active: true } },
    },
  });

  if (!membership) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: membership.role as Role,
    tenantId,
    organizationId,
  };
}

export async function updateMe(userId: string, tenantId: string, organizationId: string, data: UpdateMeInput): Promise<PublicUser> {
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();

  if (!name) {
    throw new AppError('El nombre es obligatorio', 400);
  }

  if (!email) {
    throw new AppError('El email es obligatorio', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new AppError('Ya existe un usuario con ese email', 409);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email },
  });

  return getMe(user.id, tenantId, organizationId);
}

export async function changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
  const currentPassword = data.currentPassword ?? '';
  const newPassword = data.newPassword ?? '';

  if (!currentPassword) {
    throw new AppError('La contraseña actual es obligatoria', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Recurso no encontrado', 404);
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError('La contraseña actual no es correcta', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function getCurrentTenant(tenantId: string): Promise<PublicTenant> {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, active: true },
  });

  if (!tenant) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return {
    id: tenant.id,
    organizationId: tenant.organizationId,
    name: tenant.name,
    slug: tenant.slug,
    appName: tenant.appName,
    shortName: tenant.shortName,
    mark: tenant.mark,
    claim: tenant.claim,
    description: tenant.description,
    primary: tenant.primary,
    primaryHover: tenant.primaryHover,
    primarySoft: tenant.primarySoft,
  };
}

export async function updateCurrentTenant(tenantId: string, data: UpdateTenantInput): Promise<PublicTenant> {
  const name = data.name?.trim();
  const shortName = data.shortName?.trim();
  const mark = data.mark?.trim();
  const claim = data.claim?.trim();
  const description = data.description?.trim();
  const primary = normalizeHexColor(data.primary, DEFAULT_TENANT_BRAND.primary);
  const primaryHover = normalizeHexColor(data.primaryHover, DEFAULT_TENANT_BRAND.primaryHover);
  const primarySoft = normalizeHexColor(data.primarySoft, DEFAULT_TENANT_BRAND.primarySoft);

  if (!name) {
    throw new AppError('El nombre del centro es obligatorio', 400, ['name']);
  }

  if (!shortName) {
    throw new AppError('El nombre corto es obligatorio', 400, ['shortName']);
  }

  if (!mark) {
    throw new AppError('La marca es obligatoria', 400, ['mark']);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name,
      appName: data.appName?.trim() || name,
      shortName,
      mark: mark.slice(0, 4),
      claim: claim || DEFAULT_TENANT_BRAND.claim,
      description: description || DEFAULT_TENANT_BRAND.description,
      primary,
      primaryHover,
      primarySoft,
    },
  });

  return getCurrentTenant(tenantId);
}
