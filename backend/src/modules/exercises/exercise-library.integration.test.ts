import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { ProvisionCenterUseCase } from '../../application/centers';
import { EXERCISE_LIBRARY, STARTER_EXERCISES } from '../../domain/exercise-library';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PrismaCenterRepository } from '../../infrastructure/repositories/prisma-center-repository';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher';
import { RandomPasswordGenerator } from '../../infrastructure/security/random-password-generator';

const runId = Date.now();
const slug = `biblioteca-${runId}`;
const adminEmail = `admin-${slug}@centro.test`;
const trainerEmail = `entrenador-${slug}@centro.test`;
let admin: { Authorization: string };
let trainer: { Authorization: string };

async function login(email: string, password: string) {
  const { body } = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return { Authorization: `Bearer ${body.token}` };
}

beforeAll(async () => {
  const result = await new ProvisionCenterUseCase(new PrismaCenterRepository(), new BcryptPasswordHasher(4), new RandomPasswordGenerator()).execute({
    name: `Biblioteca ${runId}`,
    slug,
    adminName: 'Admin',
    adminEmail,
    trainers: [{ name: 'Entrenador', email: trainerEmail }],
  });
  admin = await login(adminEmail, result.admin.generatedPassword!);
  trainer = await login(trainerEmail, result.trainers[0].generatedPassword!);
});

afterAll(async () => {
  const organization = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
  const tenants = await prisma.tenant.findMany({ where: { organizationId: organization?.id }, select: { id: true } });
  const tenantIds = tenants.map((tenant) => tenant.id);
  await prisma.exercise.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.userTenantMembership.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.organization.deleteMany({ where: { slug } });
  await prisma.user.deleteMany({ where: { email: { in: [adminEmail, trainerEmail] } } });
});

describe('exercise library API', () => {
  it('starts a new center with the starter pack, grouped and with library keys', async () => {
    const { body } = await request(app).get('/exercises').set(admin).expect(200);

    expect(body).toHaveLength(STARTER_EXERCISES.length);
    for (const exercise of body) {
      expect(exercise.muscleGroup, exercise.name).toEqual(expect.any(String));
      expect(exercise.libraryKey, exercise.name).toEqual(expect.any(String));
    }
  });

  it('lists the whole library marking what the center has', async () => {
    const { body } = await request(app).get('/exercises/library').set(admin).expect(200);

    expect(body.groups).toHaveLength(10);
    expect(body.exercises).toHaveLength(EXERCISE_LIBRARY.length);
    expect(body.exercises.filter((item: { added: boolean }) => item.added)).toHaveLength(STARTER_EXERCISES.length);
    expect(body.exercises.find((item: { slug: string }) => item.slug === 'remo_mancuerna')).toMatchObject({ added: false, muscleGroup: 'back' });
    expect(body.exercises.find((item: { slug: string }) => item.slug === 'dominadas')).toMatchObject({ added: true, starter: true });
  });

  it('imports exercises, and repeating the import changes nothing', async () => {
    const slugs = ['remo_mancuerna', 'face_pull', 'dominadas'];

    const first = await request(app).post('/exercises/library/import').set(admin).send({ slugs }).expect(200);
    expect(first.body).toEqual({ created: 2, reactivated: 0, skipped: 1 });

    const second = await request(app).post('/exercises/library/import').set(admin).send({ slugs }).expect(200);
    expect(second.body).toEqual({ created: 0, reactivated: 0, skipped: 3 });

    const catalog = await request(app).get('/exercises').set(admin).expect(200);
    expect(catalog.body).toHaveLength(STARTER_EXERCISES.length + 2);
    expect(catalog.body.find((item: { name: string }) => item.name === 'Face pull')).toMatchObject({ muscleGroup: 'back', libraryKey: 'face_pull' });
  });

  it('brings back a deactivated exercise instead of duplicating it', async () => {
    const catalog = await request(app).get('/exercises').set(admin).expect(200);
    const target = catalog.body.find((item: { libraryKey: string }) => item.libraryKey === 'face_pull');
    await request(app).patch(`/exercises/${target.id}/status`).set(admin).send({ status: 'INACTIVE' }).expect(200);

    const result = await request(app).post('/exercises/library/import').set(admin).send({ slugs: ['face_pull'] }).expect(200);

    expect(result.body).toEqual({ created: 0, reactivated: 1, skipped: 0 });
    const again = await request(app).get('/exercises').set(admin).expect(200);
    expect(again.body.filter((item: { libraryKey: string }) => item.libraryKey === 'face_pull')).toHaveLength(1);
  });

  it('rejects unknown or missing exercises and is admin-only', async () => {
    await request(app).post('/exercises/library/import').set(admin).send({ slugs: ['no_existe'] }).expect(400);
    await request(app).post('/exercises/library/import').set(admin).send({}).expect(400);
    await request(app).get('/exercises/library').set(trainer).expect(403);
    await request(app).post('/exercises/library/import').set(trainer).send({ slugs: ['face_pull'] }).expect(403);
    await request(app).get('/exercises/library').expect(401);
  });

  it('keeps one center library import out of the others', async () => {
    const otherEmail = `otro-${slug}@centro.test`;
    const other = await new ProvisionCenterUseCase(new PrismaCenterRepository(), new BcryptPasswordHasher(4), new RandomPasswordGenerator()).execute({
      name: `Otra ${runId}`,
      slug: `otra-${slug}`,
      adminName: 'Otro',
      adminEmail: otherEmail,
      starterExercises: false,
    });
    try {
      const otherAdmin = await login(otherEmail, other.admin.generatedPassword!);
      const catalog = await request(app).get('/exercises').set(otherAdmin).expect(200);
      expect(catalog.body).toEqual([]);
      const library = await request(app).get('/exercises/library').set(otherAdmin).expect(200);
      expect(library.body.exercises.some((item: { added: boolean }) => item.added)).toBe(false);
    } finally {
      await prisma.userTenantMembership.deleteMany({ where: { tenantId: other.tenantId! } });
      await prisma.tenant.delete({ where: { id: other.tenantId! } });
      await prisma.organization.delete({ where: { id: other.organizationId! } });
      await prisma.user.delete({ where: { email: otherEmail } });
    }
  });

  it('lets admins set and clear the muscle group of an exercise', async () => {
    const created = await request(app).post('/exercises').set(admin).send({
      name: `Propio ${runId}`, category: 'strength', defaultUnit: 'kg', muscleGroup: 'shoulders',
    }).expect(201);
    expect(created.body.muscleGroup).toBe('shoulders');

    const updated = await request(app).put(`/exercises/${created.body.id}`).set(admin).send({ muscleGroup: null }).expect(200);
    expect(updated.body.muscleGroup).toBeNull();

    await request(app).post('/exercises').set(admin).send({ name: 'Inválido', category: 'strength', defaultUnit: 'kg', muscleGroup: 'brazos' }).expect(400);
  });
});
