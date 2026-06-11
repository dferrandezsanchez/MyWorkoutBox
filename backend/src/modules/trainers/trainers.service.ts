import bcrypt from 'bcrypt';
import type { User, UserTenantMembership } from '@prisma/client';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { Role } from '../../types/domain';

export interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrainerInput {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
}

export interface UpdateTrainerInput {
  name?: string;
  email?: string;
  active?: boolean;
}

export interface ResetTrainerPasswordInput {
  password?: string;
}

function toTrainerUser(user: User, membership?: UserTenantMembership): TrainerUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (membership?.role ?? user.role) as Role,
    active: Boolean(user.active && (membership?.active ?? true)),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeName(name?: string): string {
  const normalized = name?.trim();
  if (!normalized) {
    throw new AppError('El nombre es obligatorio', 400);
  }
  return normalized;
}

function normalizeEmail(email?: string): string {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    throw new AppError('El email es obligatorio', 400);
  }
  return normalized;
}

function validatePassword(password?: string): string {
  if (!password || password.length < 8) {
    throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
  }
  return password;
}

async function assertEmailAvailable(email: string, currentUserId?: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== currentUserId) {
    throw new AppError('Ya existe un usuario con ese email', 409);
  }
}

export async function listTrainers(tenantId: string, includeInactive = true): Promise<TrainerUser[]> {
  const memberships = await prisma.userTenantMembership.findMany({
    where: {
      tenantId,
      role: Role.TRAINER,
      ...(includeInactive ? {} : { active: true }),
      user: includeInactive ? undefined : { active: true },
    },
    include: { user: true },
    orderBy: { user: { name: 'asc' } },
  });

  return memberships.map((membership) => toTrainerUser(membership.user, membership));
}

export async function getTrainer(tenantId: string, id: string): Promise<TrainerUser> {
  const membership = await prisma.userTenantMembership.findUnique({
    where: { userId_tenantId: { userId: id, tenantId } },
    include: { user: true },
  });

  if (!membership || membership.role !== Role.TRAINER) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return toTrainerUser(membership.user, membership);
}

export async function createTrainer(tenantId: string, data: CreateTrainerInput): Promise<TrainerUser> {
  const name = normalizeName(data.name);
  const email = normalizeEmail(data.email);
  const password = validatePassword(data.password);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.userTenantMembership.findUnique({
      where: { userId_tenantId: { userId: existingUser.id, tenantId } },
    });
    if (existingMembership) {
      throw new AppError('Ya existe un entrenador con ese email en este centro', 409);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      active: data.active ?? true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: Role.TRAINER,
      active: data.active ?? true,
    },
  });

  const membership = await prisma.userTenantMembership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    update: { role: Role.TRAINER, active: data.active ?? true },
    create: { userId: user.id, tenantId, role: Role.TRAINER, active: data.active ?? true },
  });

  return toTrainerUser(user, membership);
}

export async function updateTrainer(tenantId: string, id: string, data: UpdateTrainerInput): Promise<TrainerUser> {
  await getTrainer(tenantId, id);

  const updateData: { name?: string; email?: string; active?: boolean } = {};

  if (data.name !== undefined) {
    updateData.name = normalizeName(data.name);
  }

  if (data.email !== undefined) {
    updateData.email = normalizeEmail(data.email);
    await assertEmailAvailable(updateData.email, id);
  }

  if (data.active !== undefined) {
    updateData.active = Boolean(data.active);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  if (data.active !== undefined) {
    await prisma.userTenantMembership.update({
      where: { userId_tenantId: { userId: id, tenantId } },
      data: { active: Boolean(data.active) },
    });
  }

  return getTrainer(tenantId, user.id);
}

export async function setTrainerActive(tenantId: string, id: string, active: boolean): Promise<TrainerUser> {
  await getTrainer(tenantId, id);

  await prisma.userTenantMembership.update({
    where: { userId_tenantId: { userId: id, tenantId } },
    data: { active },
  });

  return getTrainer(tenantId, id);
}

export async function resetTrainerPassword(
  tenantId: string,
  id: string,
  data: ResetTrainerPasswordInput,
): Promise<void> {
  await getTrainer(tenantId, id);

  const password = validatePassword(data.password);
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}
