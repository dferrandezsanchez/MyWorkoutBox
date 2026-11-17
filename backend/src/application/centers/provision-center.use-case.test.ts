import { describe, expect, it, vi } from 'vitest';
import { BASE_EXERCISES } from '../../domain/exercise-library';
import type { CenterRepository, ProvisionCenterData } from '../../domain/repositories';
import type { PasswordGenerator, PasswordHasher } from '../ports';
import { parseTrainerOption } from './parse-trainer-option';
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
      trainers: data.trainers.map((trainer) => ({ email: trainer.email, created: true })),
      exercisesCreated: data.exercises.length,
    })),
    ...overrides,
  };
  const hasher: PasswordHasher = { hash: vi.fn(async (password: string) => `hashed:${password}`), compare: vi.fn() };
  const passwords = ['Hk7p-9mQx-Tr3w-Zc8n', 'Pq4s-2nVd-Wy6b-Jm9k', 'Xa5t-8cRf-Ld3h-Gn7z'];
  const generator: PasswordGenerator = { generate: vi.fn(() => passwords.shift() ?? 'Zz2z-2zZz-2zZz-2zZz') };
  return { centers, hasher, generator, useCase: new ProvisionCenterUseCase(centers, hasher, generator) };
}

describe('ProvisionCenterUseCase', () => {
  it('creates the center with a generated password that is stored hashed and shown once', async () => {
    const { useCase, centers } = setup();

    const result = await useCase.execute(baseInput);

    expect(result).toMatchObject({
      status: 'created',
      slug: 'one-life-one-body',
      admin: { email: 'ana@ejemplo.com', created: true, generatedPassword: 'Hk7p-9mQx-Tr3w-Zc8n' },
      trainers: [],
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
    expect(result.admin.generatedPassword).toBeNull();
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

    expect(result).toMatchObject({ status: 'exists', organizationId: 'org-9', tenantId: 'tenant-9', exercisesCreated: 0 });
    expect(result.admin.generatedPassword).toBeNull();
    expect(centers.provision).not.toHaveBeenCalled();
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('does not reveal a password when the admin email already had an account', async () => {
    const { useCase } = setup({
      provision: vi.fn(async () => ({ organizationId: 'org-1', tenantId: 'tenant-1', adminUserId: 'u', adminCreated: false, trainers: [], exercisesCreated: 7 })),
    });

    const result = await useCase.execute(baseInput);

    expect(result).toMatchObject({ status: 'created', admin: { created: false, generatedPassword: null } });
  });

  it('simulates without writing in dry-run mode', async () => {
    const { useCase, centers } = setup();

    const result = await useCase.execute({ ...baseInput, dryRun: true });

    expect(result).toMatchObject({ status: 'dry-run', exercisesCreated: BASE_EXERCISES.length, organizationId: null });
    expect(centers.provision).not.toHaveBeenCalled();
  });

  it('creates trainers with their own generated passwords', async () => {
    const { useCase, centers } = setup();

    const result = await useCase.execute({
      ...baseInput,
      trainers: [
        { name: 'Luis Gómez', email: ' Luis@Ejemplo.com ' },
        { name: 'Marta Ruiz', email: 'marta@ejemplo.com' },
      ],
    });

    const data = vi.mocked(centers.provision).mock.calls[0][0];
    expect(data.trainers).toEqual([
      { name: 'Luis Gómez', email: 'luis@ejemplo.com', passwordHash: 'hashed:Pq4s-2nVd-Wy6b-Jm9k' },
      { name: 'Marta Ruiz', email: 'marta@ejemplo.com', passwordHash: 'hashed:Xa5t-8cRf-Ld3h-Gn7z' },
    ]);
    expect(result.trainers).toEqual([
      { name: 'Luis Gómez', email: 'luis@ejemplo.com', created: true, generatedPassword: 'Pq4s-2nVd-Wy6b-Jm9k' },
      { name: 'Marta Ruiz', email: 'marta@ejemplo.com', created: true, generatedPassword: 'Xa5t-8cRf-Ld3h-Gn7z' },
    ]);
  });

  it('does not reveal a password for a trainer who already had an account', async () => {
    const { useCase } = setup({
      provision: vi.fn(async () => ({
        organizationId: 'o', tenantId: 't', adminUserId: 'u', adminCreated: true, exercisesCreated: 7,
        trainers: [{ email: 'luis@ejemplo.com', created: false }],
      })),
    });

    const result = await useCase.execute({ ...baseInput, trainers: [{ name: 'Luis', email: 'luis@ejemplo.com' }] });

    expect(result.trainers[0]).toMatchObject({ created: false, generatedPassword: null });
  });

  it('lists the trainers in a dry run and rejects repeated or invalid emails', async () => {
    const { useCase, centers } = setup();

    const dry = await useCase.execute({ ...baseInput, dryRun: true, trainers: [{ name: 'Luis', email: 'luis@ejemplo.com' }] });
    expect(dry.trainers).toEqual([{ name: 'Luis', email: 'luis@ejemplo.com', created: false, generatedPassword: null }]);

    await expect(useCase.execute({ ...baseInput, trainers: [{ name: 'Otra', email: 'ANA@ejemplo.com' }] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute({ ...baseInput, trainers: [{ name: 'Luis', email: 'luis@' }] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute({ ...baseInput, trainers: [{ name: '', email: 'luis@ejemplo.com' }] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
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

describe('parseTrainerOption', () => {
  it('reads "Nombre Apellido <correo>"', () => {
    expect(parseTrainerOption('Luis Gómez <luis@ejemplo.com>')).toEqual({ name: 'Luis Gómez', email: 'luis@ejemplo.com' });
    expect(parseTrainerOption('  Luis  <  luis@ejemplo.com  >')).toEqual({ name: 'Luis', email: 'luis@ejemplo.com' });
  });

  it('rejects other formats', () => {
    for (const value of ['luis@ejemplo.com', '<luis@ejemplo.com>', 'Luis luis@ejemplo.com', 'Luis <luis@ejemplo.com> extra', '']) {
      expect(() => parseTrainerOption(value), value).toThrow('--trainer debe tener el formato');
    }
  });
});
