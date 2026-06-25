import type { User } from '../../domain/shared/entities';
import { forbidden } from '../../domain/shared/errors';
import type { MembershipRepository } from '../../domain/repositories';
import type { TokenService } from '../ports';
import type { LoginResponse } from './auth-dtos';
import { toPublicTenant } from './auth-dtos';

export async function buildLoginResponse(
  user: User,
  tenantId: string,
  memberships: MembershipRepository,
  tokenService: TokenService,
): Promise<LoginResponse> {
  const membership = await memberships.findActiveByUserAndTenant(user.id, tenantId);
  if (!membership || !membership.tenant) throw forbidden('Tenant no disponible');

  const tenant = membership.tenant;
  const role = membership.role;
  const token = tokenService.signTenantToken({
    userId: user.id,
    tenantId: tenant.id,
    organizationId: tenant.organizationId,
    role,
  });

  return {
    token,
    tenant: toPublicTenant(tenant),
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
