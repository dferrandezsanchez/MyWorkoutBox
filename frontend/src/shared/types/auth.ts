export type Role = 'ADMIN' | 'TRAINER';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  organizationId: string;
  role: Role;
  iat: number;
  exp: number;
}

/** Training center the session is scoped to. Visual identity is always STELIOS. */
export interface ActiveTenant {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  /** The center tracks client measurements (weight, body fat, muscle mass) and goals. */
  measurementsEnabled: boolean;
}

export interface TenantOption {
  id: string;
  organizationId: string;
  name: string;
  organizationName: string;
  role: Role;
}

export interface LoginSuccessResponse {
  token: string;
  user: { id: string; name: string; email: string; role: Role; tenantId: string; organizationId: string; canManageRoutines?: boolean };
  tenant: ActiveTenant;
}

export interface TenantSelectionResponse {
  tenantSelectionRequired: true;
  selectionToken: string;
  tenants: TenantOption[];
}

export type LoginResponse = LoginSuccessResponse | TenantSelectionResponse;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  organizationId: string;
  /** Can create/edit routine templates and client plans (always true for ADMIN). */
  canManageRoutines?: boolean;
}
