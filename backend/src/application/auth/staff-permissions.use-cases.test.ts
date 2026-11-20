import { describe, expect, it, vi } from 'vitest';
import { GetActiveRoleUseCase, GetMeUseCase, canManageRoutines } from './index';
import { buildLoginResponse } from './build-login-response';
import { Role } from '../../domain/shared/enums';
import type { Membership, Tenant, User } from '../../domain/shared/entities';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { TokenService } from '../ports';

const now = new Date('2026-11-20T00:00:00.000Z');
const user: User = {
  id: 'user-1', name: 'Staff', email: 'staff@gym.com', passwordHash: 'hash',
  role: Role.TRAINER, active: true, createdAt: now, updatedAt: now,
};
const tenant = {
  id: 'tenant-1', organizationId: 'org-1', name: 'Center', slug: 'center', measurementsEnabled: true, active: true,
} as Tenant;

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 'membership-1', userId: user.id, tenantId: tenant.id, role: Role.TRAINER, canManageRoutines: false,
    active: true, createdAt: now, updatedAt: now, tenant, ...overrides,
  };
}

function membershipRepository(current: Membership | null): MembershipRepository {
  return {
    findActiveByUser: vi.fn(),
    findActiveByUserAndTenant: vi.fn(async () => current),
    findByUserAndTenant: vi.fn(),
    upsert: vi.fn(),
    updateActive: vi.fn(),
    findTrainers: vi.fn(),
    findStaff: vi.fn(),
    updateAccess: vi.fn(),
    countActiveAdmins: vi.fn(),
  };
}

const users = { findById: vi.fn(async () => user) } as unknown as UserRepository;

describe('effective routine permission', () => {
  it('is always true for admins and follows the membership flag for trainers', () => {
    expect(canManageRoutines({ role: Role.ADMIN, canManageRoutines: false })).toBe(true);
    expect(canManageRoutines({ role: Role.TRAINER, canManageRoutines: true })).toBe(true);
    expect(canManageRoutines({ role: Role.TRAINER, canManageRoutines: false })).toBe(false);
  });

  it('is exposed by /auth/me', async () => {
    const trainer = await new GetMeUseCase(users, membershipRepository(membership({ canManageRoutines: true })))
      .execute(user.id, tenant.id, 'org-1');
    const admin = await new GetMeUseCase(users, membershipRepository(membership({ role: Role.ADMIN })))
      .execute(user.id, tenant.id, 'org-1');

    expect(trainer).toMatchObject({ role: Role.TRAINER, canManageRoutines: true });
    expect(admin).toMatchObject({ role: Role.ADMIN, canManageRoutines: true });
  });

  it('is exposed in the login response user payload', async () => {
    const tokenService = { signTenantToken: vi.fn(() => 'token') } as unknown as TokenService;

    const response = await buildLoginResponse(user, tenant.id, membershipRepository(membership()), tokenService);

    expect(response.user).toMatchObject({ role: Role.TRAINER, canManageRoutines: false });
  });
});

describe('GetActiveRoleUseCase', () => {
  it('resolves the role from the active membership or null when there is none', async () => {
    await expect(new GetActiveRoleUseCase(membershipRepository(membership({ role: Role.ADMIN }))).execute(user.id, tenant.id))
      .resolves.toBe(Role.ADMIN);
    await expect(new GetActiveRoleUseCase(membershipRepository(null)).execute(user.id, tenant.id)).resolves.toBeNull();
  });
});
