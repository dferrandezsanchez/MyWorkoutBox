import type { AuditLogRepository, MembershipRepository } from '../../domain/repositories';
import { Role } from '../../domain/shared/enums';
import { badRequest, forbidden, lastAdminConflict, notFound } from '../../domain/shared/errors';
import type { TrainerUser, UpdateStaffAccessInput } from './trainer-inputs';
import { isStaffRole, toTrainerUser } from './trainer-inputs';

export { LAST_ADMIN_MESSAGE } from '../../domain/shared/errors';

export class UpdateStaffAccessUseCase {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(
    tenantId: string,
    actorUserId: string,
    targetUserId: string,
    input: UpdateStaffAccessInput = {},
  ): Promise<TrainerUser> {
    const { role, canManageRoutines } = validateInput(input);

    const membership = await this.memberships.findByUserAndTenant(targetUserId, tenantId);
    if (!membership || !membership.user || !isStaffRole(membership.role)) throw notFound();

    const roleChanges = role !== undefined && role !== membership.role;
    const permissionChanges = canManageRoutines !== undefined && canManageRoutines !== membership.canManageRoutines;

    // The last-admin invariant is checked first so a sole admin gets the more specific answer.
    // This is a fast path; the repository re-checks it atomically under a row lock.
    if (roleChanges && membership.role === Role.ADMIN && membership.active && membership.user.active) {
      const activeAdmins = await this.memberships.countActiveAdmins(tenantId);
      if (activeAdmins <= 1) throw lastAdminConflict();
    }

    if (roleChanges && targetUserId === actorUserId) {
      throw forbidden('No puedes cambiar tu propio rol');
    }

    if (!roleChanges && !permissionChanges) return toTrainerUser(membership.user, membership);

    const updated = await this.memberships.updateAccess(targetUserId, tenantId, {
      ...(roleChanges ? { role } : {}),
      ...(permissionChanges ? { canManageRoutines } : {}),
    });

    if (roleChanges) {
      await this.auditLogs.create({
        tenantId,
        userId: actorUserId,
        action: 'ROLE_CHANGE',
        entityType: 'UserTenantMembership',
        entityId: membership.id,
        metadata: JSON.stringify({ targetUserId, before: { role: membership.role }, after: { role } }),
      });
    }

    if (permissionChanges) {
      await this.auditLogs.create({
        tenantId,
        userId: actorUserId,
        action: 'PERMISSION_CHANGE',
        entityType: 'UserTenantMembership',
        entityId: membership.id,
        metadata: JSON.stringify({
          targetUserId,
          before: { canManageRoutines: membership.canManageRoutines },
          after: { canManageRoutines },
        }),
      });
    }

    return toTrainerUser(updated.user ?? membership.user, updated);
  }
}

function validateInput(input: UpdateStaffAccessInput | null): { role?: Role; canManageRoutines?: boolean } {
  const { role, canManageRoutines } = (input ?? {}) as Record<string, unknown>;

  if (role !== undefined && !isStaffRole(role)) {
    throw badRequest('Rol no válido', ['role']);
  }
  if (canManageRoutines !== undefined && typeof canManageRoutines !== 'boolean') {
    throw badRequest('El permiso de rutinas debe ser verdadero o falso', ['canManageRoutines']);
  }
  if (role === undefined && canManageRoutines === undefined) {
    throw badRequest('Indica el rol o el permiso de rutinas a cambiar');
  }

  return { role, canManageRoutines: canManageRoutines as boolean | undefined };
}
