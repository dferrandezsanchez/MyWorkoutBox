import type { MembershipRepository } from '../../domain/repositories';
import type { Membership } from '../../domain/shared/entities';
import { Role } from '../../domain/shared/enums';
import { forbidden } from '../../domain/shared/errors';

export const ROUTINE_MANAGER_REQUIRED_MESSAGE = 'No tienes permiso para gestionar rutinas';

/** ADMIN always manages routines; a TRAINER only with the explicit permission. */
export function isRoutineManager(
  membership: Pick<Membership, 'role' | 'canManageRoutines' | 'active'> | null | undefined,
): boolean {
  if (!membership?.active) return false;
  return membership.role === Role.ADMIN || (membership.role === Role.TRAINER && membership.canManageRoutines);
}

/**
 * Ensures the user has an active membership in the tenant that allows managing
 * routine templates and client routine plans. Throws 403 otherwise.
 */
export async function requireRoutineManager(
  memberships: MembershipRepository,
  tenantId: string,
  userId: string,
): Promise<Membership> {
  const membership = await memberships.findActiveByUserAndTenant(userId, tenantId);
  if (!membership || !isRoutineManager(membership)) throw forbidden(ROUTINE_MANAGER_REQUIRED_MESSAGE);
  return membership;
}
