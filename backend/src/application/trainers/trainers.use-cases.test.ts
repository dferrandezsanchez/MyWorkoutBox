import { describe, expect, it, vi } from 'vitest';
import type { Membership, User } from '../../domain/shared/entities';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import { Role } from '../../domain/shared/enums';
import {
  CreateTrainerUseCase,
  GetTrainerUseCase,
  UpdateTrainerUseCase,
  normalizeEmail,
  normalizeName,
  toTrainerUser,
  validatePassword,
} from '.';
import type { PasswordHasher } from '../ports';

const now = new Date('2026-07-04T10:00:00.000Z');
const user: User = {
  id: 'trainer-1', name: 'Trainer Original', email: 'trainer@gym.com',
  passwordHash: 'hashed', role: Role.TRAINER, active: true,
  createdAt: now, updatedAt: now,
};

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 'membership-1', userId: user.id, tenantId: 'tenant-1', role: Role.TRAINER,
    active: true, createdAt: now, updatedAt: now, user, ...overrides,
  };
}

function repositories(initialMembership = membership()) {
  let currentUser = { ...user };
  let currentMembership = { ...initialMembership, user: currentUser };
  const users: UserRepository = {
    findById: vi.fn(async () => currentUser),
    findByEmail: vi.fn(async (email) => email === currentUser.email ? currentUser : null),
    createTrainer: vi.fn(async (data) => ({ ...currentUser, ...data })),
    upsertTrainer: vi.fn(),
    update: vi.fn(async (_id, data) => {
      currentUser = { ...currentUser, ...data };
      currentMembership = { ...currentMembership, user: currentUser };
      return currentUser;
    }),
  };
  const memberships: MembershipRepository = {
    findActiveByUser: vi.fn(),
    findActiveByUserAndTenant: vi.fn(),
    findByUserAndTenant: vi.fn(async () => currentMembership),
    upsert: vi.fn(async (data) => {
      currentMembership = { ...currentMembership, ...data, user: currentUser };
      return currentMembership;
    }),
    updateActive: vi.fn(async (_userId, _tenantId, active) => {
      currentMembership = { ...currentMembership, active };
    }),
    findTrainers: vi.fn(async () => [currentMembership]),
  };
  return { users, memberships };
}

const hasher: PasswordHasher = {
  compare: vi.fn(),
  hash: vi.fn(async () => 'new-hash'),
};

describe('trainer optional fields and memberships', () => {
  it('accepts an empty partial update without changing membership state', async () => {
    const { users, memberships } = repositories();

    await new UpdateTrainerUseCase(users, memberships).execute('tenant-1', user.id, {});

    expect(users.update).toHaveBeenCalledWith(user.id, {});
    expect(memberships.updateActive).not.toHaveBeenCalled();
  });

  it('updates only the provided name and leaves membership state untouched', async () => {
    const { users, memberships } = repositories();

    const result = await new UpdateTrainerUseCase(users, memberships).execute(
      'tenant-1', user.id, { name: '  Updated Name  ' },
    );

    expect(users.update).toHaveBeenCalledWith(user.id, { name: 'Updated Name' });
    expect(memberships.updateActive).not.toHaveBeenCalled();
    expect(result).toMatchObject({ name: 'Updated Name', email: user.email, active: true });
  });

  it('updates only the provided email when it belongs to the current trainer', async () => {
    const { users, memberships } = repositories();

    await new UpdateTrainerUseCase(users, memberships).execute(
      'tenant-1', user.id, { email: '  TRAINER@GYM.COM  ' },
    );

    expect(users.update).toHaveBeenCalledWith(user.id, { email: 'trainer@gym.com' });
    expect(memberships.updateActive).not.toHaveBeenCalled();
  });

  it('synchronizes an explicitly inactive trainer membership', async () => {
    const { users, memberships } = repositories();

    const result = await new UpdateTrainerUseCase(users, memberships).execute(
      'tenant-1', user.id, { active: false },
    );

    expect(users.update).toHaveBeenCalledWith(user.id, { active: false });
    expect(memberships.updateActive).toHaveBeenCalledWith(user.id, 'tenant-1', false);
    expect(result.active).toBe(false);
  });

  it('reports an inactive membership even when the user remains active', async () => {
    const { memberships } = repositories(membership({ active: false }));

    await expect(new GetTrainerUseCase(memberships).execute('tenant-1', user.id)).resolves.toMatchObject({
      id: user.id,
      active: false,
    });
  });

  it('falls back to user role and state when no membership is supplied', () => {
    expect(toTrainerUser(user)).toMatchObject({ role: Role.TRAINER, active: true });
    expect(toTrainerUser({ ...user, active: false }, membership())).toMatchObject({ active: false });
  });

  it('reactivates an existing user when adding it to a different tenant', async () => {
    const { users, memberships } = repositories();
    vi.mocked(memberships.findByUserAndTenant).mockResolvedValueOnce(null);

    const result = await new CreateTrainerUseCase(users, memberships, hasher).execute('tenant-2', {
      name: ' Existing Trainer ', email: user.email, password: 'Password123!', active: true,
    });

    expect(users.update).toHaveBeenCalledWith(user.id, { name: 'Existing Trainer', active: true });
    expect(memberships.upsert).toHaveBeenCalledWith({
      userId: user.id, tenantId: 'tenant-2', role: Role.TRAINER, active: true,
    });
    expect(result.active).toBe(true);
  });

  it('rejects missing optional values when they become required inputs', () => {
    expect(() => normalizeName(undefined)).toThrow('El nombre es obligatorio');
    expect(() => normalizeEmail('   ')).toThrow('El email es obligatorio');
    expect(() => validatePassword(undefined)).toThrow('La contraseña debe tener al menos 8 caracteres');
    expect(() => validatePassword('short')).toThrow('La contraseña debe tener al menos 8 caracteres');
  });
});
