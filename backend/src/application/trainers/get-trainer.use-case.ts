import { Role } from '../../domain/shared/enums';
import { notFound } from '../../domain/shared/errors';
import type { MembershipRepository } from '../../domain/repositories';
import type { TrainerUser } from './trainer-inputs';
import { toTrainerUser } from './trainer-inputs';

export class GetTrainerUseCase {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(tenantId: string, id: string): Promise<TrainerUser> {
    const membership = await this.memberships.findByUserAndTenant(id, tenantId);
    if (!membership || membership.role !== Role.TRAINER || !membership.user) throw notFound();
    return toTrainerUser(membership.user, membership);
  }
}
