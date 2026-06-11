export type Role = 'ADMIN' | 'TRAINER';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  organizationId: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface TenantBrand {
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

export interface LoginSuccessResponse {
  token: string;
  user: { id: string; name: string; email: string; role: Role; tenantId: string; organizationId: string };
  tenant: TenantBrand;
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
}
