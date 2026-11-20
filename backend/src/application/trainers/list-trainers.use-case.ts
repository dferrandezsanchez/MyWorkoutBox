import type { MembershipRepository } from '../../domain/repositories';
import type { TrainerUser } from './trainer-inputs';
import { toTrainerUser } from './trainer-inputs';

/** Lists the tenant staff: ADMIN and TRAINER memberships, each with its role. */
export class ListTrainersUseCase {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(tenantId: string, includeInactive = true): Promise<TrainerUser[]> {
    const memberships = await this.memberships.findStaff(tenantId, includeInactive);
    return memberships.map((membership) => toTrainerUser(membership.user!, membership));
  }
}
