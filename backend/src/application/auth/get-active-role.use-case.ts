import type { MembershipRepository } from '../../domain/repositories';
import type { Role } from '../../domain/shared/enums';

/**
 * Resolves the current role of a user in a tenant from its active membership,
 * so authorization does not depend on the (possibly stale) role inside the JWT.
 */
export class GetActiveRoleUseCase {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(userId: string, tenantId: string): Promise<Role | null> {
    const membership = await this.memberships.findActiveByUserAndTenant(userId, tenantId);
    return membership?.role ?? null;
  }
}
