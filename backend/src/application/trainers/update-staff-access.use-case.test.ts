import { describe, expect, it, vi } from 'vitest';
import type { Membership, User } from '../../domain/shared/entities';
import type { AuditLogRepository, MembershipRepository } from '../../domain/repositories';
import { Role } from '../../domain/shared/enums';
import {
  GetTrainerUseCase,
  LAST_ADMIN_MESSAGE,
  ListTrainersUseCase,
  SELF_DEACTIVATION_MESSAGE,
  SetTrainerActiveUseCase,
  UpdateStaffAccessUseCase,
  UpdateTrainerUseCase,
  toTrainerUser,
} from '.';

const now = new Date('2026-11-20T10:00:00.000Z');
const TENANT = 'tenant-1';
const ACTOR = 'admin-actor';

function staffUser(id: string, overrides: Partial<User> = {}): User {
  return {
    id, name: `User ${id}`, email: `${id}@gym.com`, passwordHash: 'hash',
    role: Role.TRAINER, active: true, createdAt: now, updatedAt: now, ...overrides,
  };
}

function staffMembership(userId: string, overrides: Partial<Membership> = {}, user = staffUser(userId)): Membership {
  return {
    id: `membership-${userId}`, userId, tenantId: TENANT, role: Role.TRAINER, canManageRoutines: false,
    active: true, createdAt: now, updatedAt: now, user, ...overrides,
  };
}

function setup(target: Membership | null, activeAdmins = 2) {
  let current = target;
  const memberships: MembershipRepository = {
    findActiveByUser: vi.fn(),
    findActiveByUserAndTenant: vi.fn(),
    findByUserAndTenant: vi.fn(async () => current),
    upsert: vi.fn(),
    updateActive: vi.fn(),
    findTrainers: vi.fn(),
    findStaff: vi.fn(async () => (current ? [current] : [])),
    updateAccess: vi.fn(async (_userId, _tenantId, data) => {
      current = { ...current!, ...data };
      return current;
    }),
    countActiveAdmins: vi.fn(async () => activeAdmins),
  };
  const auditLogs: AuditLogRepository = { create: vi.fn(async () => undefined) };
  return { memberships, auditLogs, useCase: new UpdateStaffAccessUseCase(memberships, auditLogs) };
}

describe('UpdateStaffAccessUseCase', () => {
  it('promotes a trainer to admin and audits the role change', async () => {
    const { memberships, auditLogs, useCase } = setup(staffMembership('trainer-1'));

    const result = await useCase.execute(TENANT, ACTOR, 'trainer-1', { role: Role.ADMIN });

    expect(memberships.updateAccess).toHaveBeenCalledWith('trainer-1', TENANT, { role: Role.ADMIN });
    expect(result).toMatchObject({ id: 'trainer-1', role: Role.ADMIN, canManageRoutines: true });
    expect(auditLogs.create).toHaveBeenCalledTimes(1);
    const log = vi.mocked(auditLogs.create).mock.calls[0][0];
    expect(log).toMatchObject({ tenantId: TENANT, userId: ACTOR, action: 'ROLE_CHANGE', entityId: 'membership-trainer-1' });
    expect(JSON.parse(log.metadata!)).toEqual({
      targetUserId: 'trainer-1', before: { role: Role.TRAINER }, after: { role: Role.ADMIN },
    });
  });

  it('grants the routine permission to a trainer and audits it', async () => {
    const { memberships, auditLogs, useCase } = setup(staffMembership('trainer-1'));

    const result = await useCase.execute(TENANT, ACTOR, 'trainer-1', { canManageRoutines: true });

    expect(memberships.updateAccess).toHaveBeenCalledWith('trainer-1', TENANT, { canManageRoutines: true });
    expect(result).toMatchObject({ role: Role.TRAINER, canManageRoutines: true });
    const log = vi.mocked(auditLogs.create).mock.calls[0][0];
    expect(log.action).toBe('PERMISSION_CHANGE');
    expect(JSON.parse(log.metadata!)).toEqual({
      targetUserId: 'trainer-1', before: { canManageRoutines: false }, after: { canManageRoutines: true },
    });
  });

  it('writes one audit entry per changed field when role and permission change together', async () => {
    const { auditLogs, useCase } = setup(staffMembership('trainer-1'));

    await useCase.execute(TENANT, ACTOR, 'trainer-1', { role: Role.ADMIN, canManageRoutines: true });

    expect(vi.mocked(auditLogs.create).mock.calls.map(([log]) => log.action)).toEqual(['ROLE_CHANGE', 'PERMISSION_CHANGE']);
  });

  it('demotes an admin when another active admin remains', async () => {
    const { memberships, useCase } = setup(staffMembership('admin-2', { role: Role.ADMIN }), 2);

    const result = await useCase.execute(TENANT, ACTOR, 'admin-2', { role: Role.TRAINER });

    expect(memberships.countActiveAdmins).toHaveBeenCalledWith(TENANT);
    expect(result).toMatchObject({ role: Role.TRAINER, canManageRoutines: false });
  });

  it('refuses to demote the last active admin', async () => {
    const { memberships, auditLogs, useCase } = setup(staffMembership('admin-2', { role: Role.ADMIN }), 1);

    await expect(useCase.execute(TENANT, ACTOR, 'admin-2', { role: Role.TRAINER }))
      .rejects.toMatchObject({ code: 'CONFLICT', message: LAST_ADMIN_MESSAGE });
    expect(memberships.updateAccess).not.toHaveBeenCalled();
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('allows demoting an inactive admin without counting active admins', async () => {
    const { memberships, useCase } = setup(staffMembership('admin-2', { role: Role.ADMIN, active: false }), 1);

    await useCase.execute(TENANT, ACTOR, 'admin-2', { role: Role.TRAINER });

    expect(memberships.countActiveAdmins).not.toHaveBeenCalled();
    expect(memberships.updateAccess).toHaveBeenCalled();
  });

  it('forbids an admin from changing their own role', async () => {
    const { memberships, useCase } = setup(staffMembership(ACTOR, { role: Role.ADMIN }));

    await expect(useCase.execute(TENANT, ACTOR, ACTOR, { role: Role.TRAINER }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', message: 'No puedes cambiar tu propio rol' });
    expect(memberships.updateAccess).not.toHaveBeenCalled();
  });

  it('answers with the last-admin conflict when the sole admin tries to demote themselves', async () => {
    const { useCase } = setup(staffMembership(ACTOR, { role: Role.ADMIN }), 1);

    await expect(useCase.execute(TENANT, ACTOR, ACTOR, { role: Role.TRAINER }))
      .rejects.toMatchObject({ code: 'CONFLICT', message: LAST_ADMIN_MESSAGE });
  });

  it('returns 404 when the target is not staff of the tenant', async () => {
    await expect(setup(null).useCase.execute(TENANT, ACTOR, 'ghost', { role: Role.ADMIN }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    const noUser = staffMembership('trainer-1');
    delete noUser.user;
    await expect(setup(noUser).useCase.execute(TENANT, ACTOR, 'trainer-1', { role: Role.ADMIN }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    const foreignRole = staffMembership('trainer-1', { role: 'CLIENT' as Role });
    await expect(setup(foreignRole).useCase.execute(TENANT, ACTOR, 'trainer-1', { role: Role.ADMIN }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('validates the role, the permission type and that something changes', async () => {
    const { useCase, memberships } = setup(staffMembership('trainer-1'));

    await expect(useCase.execute(TENANT, ACTOR, 'trainer-1', { role: 'OWNER' as Role }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', fields: ['role'] });
    await expect(useCase.execute(TENANT, ACTOR, 'trainer-1', { canManageRoutines: 'yes' as unknown as boolean }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', fields: ['canManageRoutines'] });
    await expect(useCase.execute(TENANT, ACTOR, 'trainer-1', {})).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute(TENANT, ACTOR, 'trainer-1')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(memberships.findByUserAndTenant).not.toHaveBeenCalled();
  });

  it('is a no-op without audit when the requested access is already in place', async () => {
    const { memberships, auditLogs, useCase } = setup(staffMembership('trainer-1', { canManageRoutines: true }));

    const result = await useCase.execute(TENANT, ACTOR, 'trainer-1', { role: Role.TRAINER, canManageRoutines: true });

    expect(result).toMatchObject({ role: Role.TRAINER, canManageRoutines: true });
    expect(memberships.updateAccess).not.toHaveBeenCalled();
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('lets an admin toggle their own stored routine flag without touching the role', async () => {
    const { memberships, useCase } = setup(staffMembership(ACTOR, { role: Role.ADMIN }));

    const result = await useCase.execute(TENANT, ACTOR, ACTOR, { role: Role.ADMIN, canManageRoutines: true });

    expect(memberships.updateAccess).toHaveBeenCalledWith(ACTOR, TENANT, { canManageRoutines: true });
    expect(result.canManageRoutines).toBe(true);
  });
});

describe('staff lookups', () => {
  it('lists admins and trainers with their role and effective routine permission', async () => {
    const admin = staffMembership('admin-1', { role: Role.ADMIN });
    const trainer = staffMembership('trainer-1', { canManageRoutines: true });
    const { memberships } = setup(null);
    vi.mocked(memberships.findStaff).mockResolvedValueOnce([admin, trainer]);

    const result = await new ListTrainersUseCase(memberships).execute(TENANT, false);

    expect(memberships.findStaff).toHaveBeenCalledWith(TENANT, false);
    expect(result.map(({ id, role, canManageRoutines }) => ({ id, role, canManageRoutines }))).toEqual([
      { id: 'admin-1', role: Role.ADMIN, canManageRoutines: true },
      { id: 'trainer-1', role: Role.TRAINER, canManageRoutines: true },
    ]);
  });

  it('gets an admin member through the staff lookup', async () => {
    const { memberships } = setup(staffMembership('admin-1', { role: Role.ADMIN }));

    await expect(new GetTrainerUseCase(memberships).execute(TENANT, 'admin-1')).resolves.toMatchObject({
      id: 'admin-1', role: Role.ADMIN, canManageRoutines: true,
    });
  });

  it('reports the stored flag for trainers and true for admins', () => {
    expect(toTrainerUser(staffUser('t'), staffMembership('t')).canManageRoutines).toBe(false);
    expect(toTrainerUser(staffUser('a', { role: Role.ADMIN })).canManageRoutines).toBe(true);
  });
});

describe('self deactivation guard', () => {
  it('prevents an admin from deactivating themselves through status or update', async () => {
    const { memberships } = setup(staffMembership(ACTOR, { role: Role.ADMIN }));
    const users = { update: vi.fn(), findByEmail: vi.fn() };

    await expect(new SetTrainerActiveUseCase(memberships).execute(TENANT, ACTOR, false, ACTOR))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: SELF_DEACTIVATION_MESSAGE });
    await expect(new UpdateTrainerUseCase(users as never, memberships).execute(TENANT, ACTOR, { active: false }, ACTOR))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: SELF_DEACTIVATION_MESSAGE });
    expect(memberships.updateActive).not.toHaveBeenCalled();
    expect(users.update).not.toHaveBeenCalled();
  });

  it('still lets an admin deactivate another staff member or reactivate themselves', async () => {
    const { memberships } = setup(staffMembership('admin-2', { role: Role.ADMIN }));

    await new SetTrainerActiveUseCase(memberships).execute(TENANT, 'admin-2', false, ACTOR);
    await new SetTrainerActiveUseCase(memberships).execute(TENANT, ACTOR, true, ACTOR);

    expect(memberships.updateActive).toHaveBeenCalledTimes(2);
  });
});
