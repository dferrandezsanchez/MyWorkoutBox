import { notFound } from '../../domain/shared/errors';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { PublicUser } from './auth-dtos';

export class GetMeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(userId: string, tenantId: string, organizationId: string): Promise<PublicUser> {
    const [user, membership] = await Promise.all([
      this.users.findById(userId),
      this.memberships.findActiveByUserAndTenant(userId, tenantId),
    ]);

    if (!user || !membership) throw notFound();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: membership.role,
      tenantId,
      organizationId,
    };
  }
}
