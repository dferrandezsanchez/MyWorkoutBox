import type { Tenant } from '../../domain/shared/entities';
import type { Role } from '../../domain/shared/enums';
import { internal } from '../../domain/shared/errors';

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

export type LoginResult = LoginResponse | TenantSelectionResponse;

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
export const DEFAULT_TENANT_BRAND = {
  claim: 'Training Intelligence',
  description: 'Gestión de clientes, entrenadores, ejercicios y marcas.',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primarySoft: '#93C5FD',
};

export function normalizeHexColor(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && HEX_COLOR_RE.test(normalized) ? normalized : fallback;
}

export function toPublicTenant(tenant: Tenant): PublicTenant {
  if (!tenant.organizationId) throw internal();
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
