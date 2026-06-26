import { describe, expect, it, vi } from 'vitest';
import {
  ChangePasswordUseCase,
  LoginUseCase,
  SelectTenantUseCase,
  UpdateCurrentTenantUseCase,
  UpdateMeUseCase,
} from './index';
import { Role } from '../../domain/shared/enums';
import type { Membership, Organization, Tenant, User } from '../../domain/shared/entities';
import type { MembershipRepository, TenantRepository, UserRepository } from '../../domain/repositories';
import type { PasswordHasher, TokenService } from '../ports';

const now = new Date('2026-06-26T00:00:00.000Z');

const user: User = {
  id: 'user-1',
  name: 'Admin User',
  email: 'admin@gym.com',
  passwordHash: 'hashed-current',
  role: Role.ADMIN,
  active: true,
  createdAt: now,
  updatedAt: now,
};

const organization: Organization = {
  id: 'org-1',
  name: 'Demo Org',
  slug: 'demo-org',
  active: true,
};

const tenant: Tenant = {
  id: 'tenant-1',
  organizationId: organization.id,
  name: 'Demo Center',
  slug: 'demo-center',
  appName: 'MyWorkoutBox',
  shortName: 'Demo',
  mark: 'MW',
  claim: 'Training Intelligence',
  description: 'Demo tenant',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primarySoft: '#93C5FD',
  active: true,
};

function membership(input: Partial<Membership> = {}): Membership {
  return {
    id: input.id ?? 'membership-1',
    userId: input.userId ?? user.id,
    tenantId: input.tenantId ?? tenant.id,
    role: input.role ?? Role.ADMIN,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
    tenant: input.tenant ?? { ...tenant, organization },
    user,
  };
}

function createUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findById: vi.fn(async (id) => (id === user.id ? user : null)),
    findByEmail: vi.fn(async (email) => (email === user.email ? user : null)),
    createTrainer: vi.fn(),
    upsertTrainer: vi.fn(),
    update: vi.fn(async (_id, data) => ({ ...user, ...data })),
    ...overrides,
  };
}

function createMembershipRepository(overrides: Partial<MembershipRepository> = {}): MembershipRepository {
  return {
    findActiveByUser: vi.fn(async () => [membership()]),
    findActiveByUserAndTenant: vi.fn(async (_userId, tenantId) =>
      tenantId === tenant.id ? membership() : null,
    ),
    findByUserAndTenant: vi.fn(),
    upsert: vi.fn(),
    updateActive: vi.fn(),
    findTrainers: vi.fn(),
    ...overrides,
  };
}

function createTenantRepository(overrides: Partial<TenantRepository> = {}): TenantRepository {
  return {
    findActiveById: vi.fn(async (id) => (id === tenant.id ? tenant : null)),
    updateBranding: vi.fn(),
    ...overrides,
  };
}

function createPasswordHasher(overrides: Partial<PasswordHasher> = {}): PasswordHasher {
  return {
    compare: vi.fn(async (password) => password === 'Current1234!'),
    hash: vi.fn(async (password) => `hashed-${password}`),
    ...overrides,
  };
}

function createTokenService(overrides: Partial<TokenService> = {}): TokenService {
  return {
    signTenantToken: vi.fn(() => 'tenant-token'),
    signSelectionToken: vi.fn(() => 'selection-token'),
    verify: vi.fn(() => ({ sub: user.id, purpose: 'tenant-selection' })),
    ...overrides,
  };
}

describe('auth use cases', () => {
  it('returns tenant options instead of a tenant token when a user has multiple memberships', async () => {
    const memberships = createMembershipRepository({
      findActiveByUser: vi.fn(async () => [
        membership(),
        membership({
          id: 'membership-2',
          tenantId: 'tenant-2',
          role: Role.TRAINER,
          tenant: {
            ...tenant,
            id: 'tenant-2',
            name: 'Second Center',
            organization: { ...organization, id: 'org-2', name: 'Second Org' },
          },
        }),
      ]),
    });

    const result = await new LoginUseCase(
      createUserRepository(),
      memberships,
      createPasswordHasher(),
      createTokenService(),
    ).execute(user.email, 'Current1234!');

    expect(result).toMatchObject({
      tenantSelectionRequired: true,
      selectionToken: 'selection-token',
      tenants: [
        { id: 'tenant-1', organizationName: 'Demo Org', role: Role.ADMIN },
        { id: 'tenant-2', organizationName: 'Second Org', role: Role.TRAINER },
      ],
    });
  });

  it('rejects tenant selection tokens with the wrong purpose', async () => {
    const useCase = new SelectTenantUseCase(
      createUserRepository(),
      createMembershipRepository(),
      createTokenService({ verify: vi.fn(() => ({ sub: user.id, purpose: 'password-reset' })) }),
    );

    await expect(useCase.execute('selection-token', tenant.id)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Token de selección inválido',
    });
  });

  it('changes password only when current password is valid', async () => {
    const users = createUserRepository();
    const hasher = createPasswordHasher();

    await new ChangePasswordUseCase(users, hasher).execute(user.id, {
      currentPassword: 'Current1234!',
      newPassword: 'NewPassword1234!',
    });

    expect(hasher.hash).toHaveBeenCalledWith('NewPassword1234!');
    expect(users.update).toHaveBeenCalledWith(user.id, { passwordHash: 'hashed-NewPassword1234!' });
  });

  it('rejects password change when the current password does not match', async () => {
    await expect(
      new ChangePasswordUseCase(
        createUserRepository(),
        createPasswordHasher({ compare: vi.fn(async () => false) }),
      ).execute(user.id, {
        currentPassword: 'wrong',
        newPassword: 'NewPassword1234!',
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'La contraseña actual no es correcta',
    });
  });

  it('prevents updating the profile to an email owned by another user', async () => {
    await expect(
      new UpdateMeUseCase(
        createUserRepository({
          findByEmail: vi.fn(async () => ({ ...user, id: 'another-user' })),
        }),
        createMembershipRepository(),
      ).execute(user.id, tenant.id, organization.id, {
        name: 'Admin User',
        email: 'taken@gym.com',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Ya existe un usuario con ese email',
    });
  });

  it('normalizes tenant branding and applies defaults for optional text', async () => {
    const tenants = createTenantRepository();

    const result = await new UpdateCurrentTenantUseCase(tenants).execute(tenant.id, {
      name: '  Updated Center  ',
      appName: '',
      shortName: '  UP  ',
      mark: '  LONGMARK  ',
      claim: '',
      description: '',
      primary: 'invalid',
      primaryHover: '#111111',
      primarySoft: '#222222',
    });

    expect(tenants.updateBranding).toHaveBeenCalledWith(tenant.id, {
      name: 'Updated Center',
      appName: 'Updated Center',
      shortName: 'UP',
      mark: 'LONG',
      claim: 'Training Intelligence',
      description: 'Gestión de clientes, entrenadores, ejercicios y marcas.',
      primary: '#2563EB',
      primaryHover: '#111111',
      primarySoft: '#222222',
    });
    expect(result.id).toBe(tenant.id);
  });
});
