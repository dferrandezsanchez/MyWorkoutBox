import { describe, expect, it, vi } from 'vitest';
import { BASE_EXERCISES } from '../../domain/exercise-library';
import type { CenterRepository, ProvisionCenterData } from '../../domain/repositories';
import type { PasswordGenerator, PasswordHasher } from '../ports';
import { ProvisionCenterUseCase } from './provision-center.use-case';

const baseInput = { name: 'One Life One body', adminName: 'Ana Pérez', adminEmail: '  Ana@Ejemplo.COM ' };

function setup(overrides: Partial<CenterRepository> = {}) {
  const centers: CenterRepository = {
    findOrganizationBySlug: vi.fn(async () => null),
    provision: vi.fn(async (data: ProvisionCenterData) => ({
      organizationId: 'org-1',
      tenantId: 'tenant-1',
      adminUserId: 'user-1',
      adminCreated: true,
      exercisesCreated: data.exercises.length,
    })),
    ...overrides,
  };
  const hasher: PasswordHasher = { hash: vi.fn(async (password: string) => `hashed:${password}`), compare: vi.fn() };
  const generator: PasswordGenerator = { generate: vi.fn(() => 'Hk7p-9mQx-Tr3w-Zc8n') };
  return { centers, hasher, generator, useCase: new ProvisionCenterUseCase(centers, hasher, generator) };
}

describe('ProvisionCenterUseCase', () => {
  it('creates the center with a generated password that is stored hashed and shown once', async () => {
    const { useCase, centers } = setup();

    const result = await useCase.execute(baseInput);

    expect(result).toMatchObject({
      status: 'created',
      slug: 'one-life-one-body',
      adminEmail: 'ana@ejemplo.com',
      generatedPassword: 'Hk7p-9mQx-Tr3w-Zc8n',
      exercisesCreated: BASE_EXERCISES.length,
    });
    const data = vi.mocked(centers.provision).mock.calls[0][0];
    expect(data.admin.passwordHash).toBe('hashed:Hk7p-9mQx-Tr3w-Zc8n');
    expect(JSON.stringify(data)).not.toContain('"Hk7p-9mQx-Tr3w-Zc8n"');
    expect(data.organization).toEqual({ name: 'One Life One body', slug: 'one-life-one-body' });
    expect(data.exercises.map((exercise) => exercise.name)).toEqual(BASE_EXERCISES.map((exercise) => exercise.name));
  });

  it('uses a provided password and never echoes it back', async () => {
    const { useCase, generator } = setup();

    const result = await useCase.execute({ ...baseInput, adminPassword: 'una-clave-larga' });

    expect(generator.generate).not.toHaveBeenCalled();
    expect(result.generatedPassword).toBeNull();
  });

  it('can skip the starter catalog and honors an explicit slug', async () => {
    const { useCase, centers } = setup();

    await useCase.execute({ ...baseInput, slug: 'OLOB', starterExercises: false });

    const data = vi.mocked(centers.provision).mock.calls[0][0];
    expect(data.exercises).toEqual([]);
    expect(data.tenant.slug).toBe('olob');
  });

  it('changes nothing when the center already exists', async () => {
    const { useCase, centers, hasher } = setup({ findOrganizationBySlug: vi.fn(async () => ({ id: 'org-9', tenantId: 'tenant-9' })) });

    const result = await useCase.execute(baseInput);

    expect(result).toMatchObject({ status: 'exists', organizationId: 'org-9', tenantId: 'tenant-9', generatedPassword: null, exercisesCreated: 0 });
    expect(centers.provision).not.toHaveBeenCalled();
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('does not reveal a password when the admin email already had an account', async () => {
    const { useCase } = setup({
      provision: vi.fn(async () => ({ organizationId: 'org-1', tenantId: 'tenant-1', adminUserId: 'u', adminCreated: false, exercisesCreated: 7 })),
    });

    const result = await useCase.execute(baseInput);

    expect(result).toMatchObject({ status: 'created', adminCreated: false, generatedPassword: null });
  });

  it('simulates without writing in dry-run mode', async () => {
    const { useCase, centers } = setup();

    const result = await useCase.execute({ ...baseInput, dryRun: true });

    expect(result).toMatchObject({ status: 'dry-run', exercisesCreated: BASE_EXERCISES.length, organizationId: null });
    expect(centers.provision).not.toHaveBeenCalled();
  });

  it('validates the input before touching anything', async () => {
    const { useCase, centers } = setup();

    await expect(useCase.execute({ ...baseInput, adminEmail: 'sin-arroba' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute({ ...baseInput, adminEmail: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute({ ...baseInput, adminName: ' ' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute({ ...baseInput, name: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute({ ...baseInput, adminPassword: 'corta' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(centers.findOrganizationBySlug).not.toHaveBeenCalled();
    expect(centers.provision).not.toHaveBeenCalled();
  });
});
