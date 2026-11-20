import { badRequest, notFound } from '../../domain/shared/errors';
import type { MembershipRepository } from '../../domain/repositories';
import type { TrainerUser } from './trainer-inputs';
import { isStaffRole, toTrainerUser } from './trainer-inputs';

export const SELF_DEACTIVATION_MESSAGE = 'No puedes desactivar tu propio usuario';

/** Looks up any staff member (ADMIN or TRAINER) of the tenant. */
export class GetTrainerUseCase {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(tenantId: string, id: string): Promise<TrainerUser> {
    const membership = await this.memberships.findByUserAndTenant(id, tenantId);
    if (!membership || !isStaffRole(membership.role) || !membership.user) throw notFound();
    return toTrainerUser(membership.user, membership);
  }
}

export function assertNotSelfDeactivation(actorUserId: string | undefined, targetUserId: string, active: boolean | undefined): void {
  if (active === false && actorUserId !== undefined && actorUserId === targetUserId) {
    throw badRequest(SELF_DEACTIVATION_MESSAGE, ['active']);
  }
}
