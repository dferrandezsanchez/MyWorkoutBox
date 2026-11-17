import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import { ProvisionCenterUseCase } from '../../application/centers';
import { BASE_EXERCISES } from '../../domain/exercise-library';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PrismaCenterRepository } from '../../infrastructure/repositories/prisma-center-repository';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher';
import { RandomPasswordGenerator } from '../../infrastructure/security/random-password-generator';
import { Role } from '../../types/domain';
import { ensureTenantMembership } from '../../test/tenant';

const runId = Date.now();
const useCase = new ProvisionCenterUseCase(new PrismaCenterRepository(), new BcryptPasswordHasher(4), new RandomPasswordGenerator());
const slugs: string[] = [];
const emails: string[] = [];
const baselineEmail = `provision-baseline-${runId}@centro.test`;
const baselinePassword = 'baseline-clave-1234';

function newCenter(label: string) {
  const name = `Centro ${label} ${runId}`;
  const slug = `centro-${label}-${runId}`;
  const adminEmail = `admin-${label}-${runId}@centro.test`;
  slugs.push(slug);
  emails.push(adminEmail);
  return { name, slug, adminEmail, adminName: `Admin ${label}` };
}

function login(email: string, password: string) {
  return request(app).post('/auth/login').send({ email, password });
}

let baselineToken = '';

beforeAll(async () => {
  const baseline = await prisma.user.create({
    data: { name: 'Baseline', email: baselineEmail, passwordHash: await bcrypt.hash(baselinePassword, 4), role: Role.ADMIN, active: true },
  });
  emails.push(baselineEmail);
  await ensureTenantMembership(baseline.id, Role.ADMIN);
  baselineToken = (await login(baselineEmail, baselinePassword).expect(200)).body.token;
});

afterAll(async () => {
  const organizations = await prisma.organization.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
  const orgIds = organizations.map((organization) => organization.id);
  const tenants = await prisma.tenant.findMany({ where: { organizationId: { in: orgIds } }, select: { id: true } });
  const tenantIds = tenants.map((tenant) => tenant.id);
  await prisma.exercise.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.userTenantMembership.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.userTenantMembership.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
});

describe('center provisioning', () => {
  it('creates an isolated center whose admin can log in with the generated password', async () => {
    const input = newCenter('alta');

    const result = await useCase.execute(input);

    expect(result).toMatchObject({ status: 'created', slug: input.slug, admin: { created: true }, exercisesCreated: BASE_EXERCISES.length });
    expect(result.admin.generatedPassword).toMatch(/^\S{4}(-\S{4}){3}$/);

    const session = await login(input.adminEmail, result.admin.generatedPassword!).expect(200);
    expect(session.body.user).toMatchObject({ email: input.adminEmail, role: Role.ADMIN, tenantId: result.tenantId });
    expect(session.body.tenant).toMatchObject({ name: input.name, slug: input.slug });

    const auth = { Authorization: `Bearer ${session.body.token}` };
    const exercises = await request(app).get('/exercises').set(auth).expect(200);
    expect(exercises.body.map((exercise: { name: string }) => exercise.name).sort((a: string, b: string) => a.localeCompare(b)))
      .toEqual(BASE_EXERCISES.map((exercise) => exercise.name).sort((a, b) => a.localeCompare(b)));
    expect((await request(app).get('/clients').set(auth).expect(200)).body).toEqual([]);
    expect((await request(app).get('/trainers').set(auth).expect(200)).body).toEqual([]);

    // Isolation: another center cannot see any of the new center's exercises, and vice versa.
    const newIds = new Set(exercises.body.map((exercise: { id: string }) => exercise.id));
    const otherCenter = await request(app).get('/exercises').set({ Authorization: `Bearer ${baselineToken}` }).expect(200);
    expect(otherCenter.body.filter((exercise: { id: string }) => newIds.has(exercise.id))).toEqual([]);
    expect(await prisma.exercise.count({ where: { tenantId: result.tenantId!, NOT: { id: { in: [...newIds] as string[] } } } })).toBe(0);
    await login(input.adminEmail, 'otra-clave-distinta').expect(401);
  });

  it('is safe to repeat: the second run changes nothing and keeps the password', async () => {
    const input = newCenter('repetido');
    const first = await useCase.execute(input);
    const exercisesBefore = await prisma.exercise.count({ where: { tenantId: first.tenantId! } });

    const second = await useCase.execute({ ...input, adminEmail: `otro-${input.adminEmail}` });

    expect(second).toMatchObject({ status: 'exists', organizationId: first.organizationId, tenantId: first.tenantId });
    expect(second.admin.generatedPassword).toBeNull();
    expect(await prisma.exercise.count({ where: { tenantId: first.tenantId! } })).toBe(exercisesBefore);
    expect(await prisma.user.findUnique({ where: { email: `otro-${input.adminEmail}` } })).toBeNull();
    await login(input.adminEmail, first.admin.generatedPassword!).expect(200);
  });

  it('gives an existing user access to the new center without touching their password', async () => {
    const input = newCenter('existente');
    const user = await prisma.user.create({
      data: { name: 'Ya existía', email: input.adminEmail, passwordHash: await bcrypt.hash('clave-que-ya-tenia', 4), role: Role.ADMIN, active: true },
    });
    await ensureTenantMembership(user.id, Role.ADMIN);

    const result = await useCase.execute(input);

    expect(result).toMatchObject({ status: 'created', admin: { created: false, generatedPassword: null } });
    const session = await login(input.adminEmail, 'clave-que-ya-tenia').expect(200);
    expect(session.body.tenantSelectionRequired).toBe(true);
    expect(session.body.tenants.map((tenant: { name: string }) => tenant.name)).toContain(input.name);
  });

  it('refuses a deactivated user and leaves nothing half-created', async () => {
    const input = newCenter('desactivado');
    await prisma.user.create({
      data: { name: 'Baja', email: input.adminEmail, passwordHash: 'x', role: Role.ADMIN, active: false },
    });

    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await prisma.organization.findUnique({ where: { slug: input.slug } })).toBeNull();
    expect(await prisma.tenant.findUnique({ where: { slug: input.slug } })).toBeNull();
  });

  it('creates the trainers with their own access and the right permissions', async () => {
    const input = newCenter('equipo');
    const trainerEmail = `entrenador-${input.slug}@centro.test`;
    emails.push(trainerEmail);

    const result = await useCase.execute({ ...input, trainers: [{ name: 'Entrenador Uno', email: trainerEmail }] });

    expect(result.trainers).toHaveLength(1);
    expect(result.trainers[0]).toMatchObject({ created: true, email: trainerEmail });
    expect(result.trainers[0].generatedPassword).not.toBe(result.admin.generatedPassword);

    const session = await login(trainerEmail, result.trainers[0].generatedPassword!).expect(200);
    expect(session.body.user).toMatchObject({ role: Role.TRAINER, tenantId: result.tenantId });
    const auth = { Authorization: `Bearer ${session.body.token}` };
    expect((await request(app).get('/exercises').set(auth).expect(200)).body).toHaveLength(BASE_EXERCISES.length);
    // Trainers cannot manage the team: that stays with the admin.
    await request(app).get('/trainers').set(auth).expect(403);

    const admin = await login(input.adminEmail, result.admin.generatedPassword!).expect(200);
    const team = await request(app).get('/trainers').set({ Authorization: `Bearer ${admin.body.token}` }).expect(200);
    expect(team.body.map((member: { email: string }) => member.email)).toEqual([trainerEmail]);
  });

  it('creates nothing when a trainer email belongs to a deactivated user', async () => {
    const input = newCenter('equipo-baja');
    const trainerEmail = `baja-${input.slug}@centro.test`;
    emails.push(trainerEmail);
    await prisma.user.create({ data: { name: 'Baja', email: trainerEmail, passwordHash: 'x', role: Role.TRAINER, active: false } });

    await expect(useCase.execute({ ...input, trainers: [{ name: 'Baja', email: trainerEmail }] })).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await prisma.organization.findUnique({ where: { slug: input.slug } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { email: input.adminEmail } })).toBeNull();
  });

  it('creates an empty catalog when asked', async () => {
    const input = newCenter('vacio');

    const result = await useCase.execute({ ...input, starterExercises: false });

    expect(result.exercisesCreated).toBe(0);
    expect(await prisma.exercise.count({ where: { tenantId: result.tenantId! } })).toBe(0);
  });
});
