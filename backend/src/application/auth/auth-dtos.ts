import type { Membership, Tenant } from '../../domain/shared/entities';
import { Role } from '../../domain/shared/enums';
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
  /** Effective routine permission in the current tenant (always true for ADMIN). */
  canManageRoutines: boolean;
  tenantId: string;
  organizationId: string;
}

export function canManageRoutines(membership: Pick<Membership, 'role' | 'canManageRoutines'>): boolean {
  return membership.role === Role.ADMIN || Boolean(membership.canManageRoutines);
}

export interface PublicTenant {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  measurementsEnabled: boolean;
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
  measurementsEnabled?: boolean;
}

export type LoginResult = LoginResponse | TenantSelectionResponse;

export function toPublicTenant(tenant: Tenant): PublicTenant {
  if (!tenant.organizationId) throw internal();
  return {
    id: tenant.id,
    organizationId: tenant.organizationId,
    name: tenant.name,
    slug: tenant.slug,
    measurementsEnabled: tenant.measurementsEnabled,
  };
}
