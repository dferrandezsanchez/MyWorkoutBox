import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role } from '../../types/domain';
import { TEST_TENANT_ID, addMembership, createIsolatedTenant, ensureTenantMembership } from '../../test/tenant';

const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const password = 'RoutinesB1234!';
let adminToken: string;
let trainerToken: string;
let managerTrainerToken: string;
let otherAdminToken: string;
let exerciseIds: string[];
let archivedExerciseId: string;
let clientId: string;
let inactiveClientId: string;

async function createUser(email: string, role: Role) {
  return prisma.user.create({
    data: { name: email, email, passwordHash: await bcrypt.hash(password, 10), role, active: true },
  });
}

async function login(email: string): Promise<string> {
  const response = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return `Bearer ${response.body.token}`;
}

async function createExercise(tenantId: string, name: string, status = 'ACTIVE') {
  return prisma.exercise.create({
    data: {
      tenantId,
      name,
      category: 'strength',
      defaultUnit: 'kg',
      measurementFields: '[]',
      variantGroups: '[]',
      status,
    },
  });
}

beforeAll(async () => {
  const admin = await createUser(`routines-b-admin-${runId}@gym.com`, Role.ADMIN);
  await ensureTenantMembership(admin.id, Role.ADMIN);
  const trainer = await createUser(`routines-b-trainer-${runId}@gym.com`, Role.TRAINER);
  await ensureTenantMembership(trainer.id, Role.TRAINER);
  const manager = await createUser(`routines-b-manager-${runId}@gym.com`, Role.TRAINER);
  await ensureTenantMembership(manager.id, Role.TRAINER);
  await prisma.userTenantMembership.update({
    where: { userId_tenantId: { userId: manager.id, tenantId: TEST_TENANT_ID } },
    data: { canManageRoutines: true },
  });

  const otherTenantId = await createIsolatedTenant(`routines_b_${runId.replace('-', '_')}`);
  const otherAdmin = await createUser(`routines-b-other-${runId}@gym.com`, Role.ADMIN);
  await addMembership(otherAdmin.id, otherTenantId, Role.ADMIN);

  exerciseIds = await Promise.all([1, 2, 3].map(async (n) => (await createExercise(TEST_TENANT_ID, `routines-b-ex-${n}-${runId}`)).id));
  archivedExerciseId = (await createExercise(TEST_TENANT_ID, `routines-b-old-${runId}`, 'INACTIVE')).id;
  clientId = (await prisma.client.create({
    data: { tenantId: TEST_TENANT_ID, firstName: 'routines-b', lastName: `Cliente ${runId}`, birthDate: new Date('1990-01-01T00:00:00.000Z') },
  })).id;
  inactiveClientId = (await prisma.client.create({
    data: { tenantId: TEST_TENANT_ID, firstName: 'routines-b', lastName: `Baja ${runId}`, birthDate: new Date('1990-01-01T00:00:00.000Z'), status: 'INACTIVE' },
  })).id;

  [adminToken, trainerToken, managerTrainerToken, otherAdminToken] = await Promise.all([
    login(admin.email),
    login(trainer.email),
    login(manager.email),
    login(otherAdmin.email),
  ]);
});

describe('routine templates and client routine plans', () => {
  let templateA: string;
  let templateB: string;

  it('lets an admin create, read and update templates with ordered exercises', async () => {
    const created = await request(app).post('/routines').set('Authorization', adminToken).send({
      name: `  routines-b A ${runId} `,
      notes: 'Empuje',
      exercises: [
        { exerciseId: exerciseIds[1], targetSets: 4, targetReps: '8-10' },
        { exerciseId: exerciseIds[0] },
      ],
    }).expect(201);
    templateA = created.body.id;
    expect(created.body.name).toBe(`routines-b A ${runId}`);
    expect(created.body.status).toBe('ACTIVE');
    expect(created.body.exercises.map((item: { exerciseId: string; position: number }) => [item.exerciseId, item.position]))
      .toEqual([[exerciseIds[1], 1], [exerciseIds[0], 2]]);
    expect(created.body.exercises[0]).toMatchObject({ targetSets: 4, targetReps: '8-10' });
    expect(created.body.exercises[0].exercise.id).toBe(exerciseIds[1]);

    const updated = await request(app).put(`/routines/${templateA}`).set('Authorization', adminToken).send({
      name: `routines-b A ${runId}`,
      exercises: [{ exerciseId: exerciseIds[0] }, { exerciseId: exerciseIds[2], targetSets: 3 }, { exerciseId: exerciseIds[1] }],
    }).expect(200);
    expect(updated.body.notes).toBeNull();
    expect(updated.body.exercises.map((item: { exerciseId: string }) => item.exerciseId)).toEqual([exerciseIds[0], exerciseIds[2], exerciseIds[1]]);

    const fetched = await request(app).get(`/routines/${templateA}`).set('Authorization', trainerToken).expect(200);
    expect(fetched.body.exercises).toHaveLength(3);

    const audit = await prisma.auditLog.findMany({ where: { entityType: 'RoutineTemplate', entityId: templateA } });
    expect(audit.map((log) => log.action).sort((a, b) => a.localeCompare(b))).toEqual(['CREATE', 'UPDATE']);
  });

  it('validates templates', async () => {
    const post = (body: object) => request(app).post('/routines').set('Authorization', adminToken).send(body);
    await post({ name: '', exercises: [{ exerciseId: exerciseIds[0] }] }).expect(400);
    await post({ name: 'routines-b sin ejercicios', exercises: [] }).expect(400);
    await post({ name: 'routines-b dup', exercises: [{ exerciseId: exerciseIds[0] }, { exerciseId: exerciseIds[0] }] }).expect(400);
    await post({ name: 'routines-b archivado', exercises: [{ exerciseId: archivedExerciseId }] }).expect(400);
    await post({ name: 'routines-b sets', exercises: [{ exerciseId: exerciseIds[0], targetSets: 25 }] }).expect(400);
  });

  it('only lets routine managers write templates', async () => {
    await request(app).get('/routines').set('Authorization', trainerToken).expect(200);
    await request(app).post('/routines').set('Authorization', trainerToken)
      .send({ name: 'routines-b nope', exercises: [{ exerciseId: exerciseIds[0] }] }).expect(403);
    await request(app).put(`/routines/${templateA}`).set('Authorization', trainerToken)
      .send({ name: 'routines-b nope', exercises: [{ exerciseId: exerciseIds[0] }] }).expect(403);
    await request(app).patch(`/routines/${templateA}/status`).set('Authorization', trainerToken).send({ status: 'INACTIVE' }).expect(403);

    const created = await request(app).post('/routines').set('Authorization', managerTrainerToken)
      .send({ name: `routines-b B ${runId}`, exercises: [{ exerciseId: exerciseIds[2] }] }).expect(201);
    templateB = created.body.id;
  });

  it('archives and restores templates, hiding archived ones by default', async () => {
    await request(app).patch(`/routines/${templateB}/status`).set('Authorization', adminToken).send({ status: 'INACTIVE' }).expect(200);
    const active = await request(app).get('/routines').set('Authorization', trainerToken).expect(200);
    const activeIds = active.body.map((item: { id: string }) => item.id);
    expect(activeIds).toContain(templateA);
    expect(activeIds).not.toContain(templateB);

    const all = await request(app).get('/routines?includeInactive=true').set('Authorization', trainerToken).expect(200);
    expect(all.body.map((item: { id: string }) => item.id)).toContain(templateB);

    await request(app).patch(`/routines/${templateB}/status`).set('Authorization', adminToken).send({ status: 'BAD' }).expect(400);
    await request(app).patch(`/routines/${templateB}/status`).set('Authorization', managerTrainerToken).send({ status: 'ACTIVE' }).expect(200);
  });

  it('assigns, replaces, advances and removes a client plan', async () => {
    const empty = await request(app).get(`/clients/${clientId}/routine-plan`).set('Authorization', trainerToken).expect(200);
    expect(empty.body).toBeNull();

    const assigned = await request(app).put(`/clients/${clientId}/routine-plan`).set('Authorization', adminToken)
      .send({ name: '', templateIds: [templateA, templateB, templateA] }).expect(200);
    expect(assigned.body).toMatchObject({ name: 'Serie de rutinas', nextPosition: 1, active: true });
    expect(assigned.body.items.map((item: { templateId: string; position: number }) => [item.templateId, item.position]))
      .toEqual([[templateA, 1], [templateB, 2], [templateA, 3]]);
    expect(assigned.body.items[0].template.exercises).toHaveLength(3);

    const replaced = await request(app).put(`/clients/${clientId}/routine-plan`).set('Authorization', managerTrainerToken)
      .send({ name: 'Bloque fuerza', templateIds: [templateB, templateA], nextPosition: 2 }).expect(200);
    expect(replaced.body.id).not.toBe(assigned.body.id);
    expect(await prisma.clientRoutinePlan.count({ where: { clientId, active: true } })).toBe(1);

    const read = await request(app).get(`/clients/${clientId}/routine-plan`).set('Authorization', trainerToken).expect(200);
    expect(read.body).toMatchObject({ id: replaced.body.id, name: 'Bloque fuerza', nextPosition: 2 });

    const next = await request(app).patch(`/clients/${clientId}/routine-plan/next`).set('Authorization', adminToken).send({ nextPosition: 1 }).expect(200);
    expect(next.body.nextPosition).toBe(1);
    await request(app).patch(`/clients/${clientId}/routine-plan/next`).set('Authorization', adminToken).send({ nextPosition: 3 }).expect(400);

    await request(app).put(`/clients/${clientId}/routine-plan`).set('Authorization', trainerToken).send({ templateIds: [templateA] }).expect(403);
    await request(app).patch(`/clients/${clientId}/routine-plan/next`).set('Authorization', trainerToken).send({ nextPosition: 2 }).expect(403);
    await request(app).delete(`/clients/${clientId}/routine-plan`).set('Authorization', trainerToken).expect(403);

    await request(app).delete(`/clients/${clientId}/routine-plan`).set('Authorization', adminToken).expect(204);
    const afterDelete = await request(app).get(`/clients/${clientId}/routine-plan`).set('Authorization', trainerToken).expect(200);
    expect(afterDelete.body).toBeNull();
    await request(app).delete(`/clients/${clientId}/routine-plan`).set('Authorization', adminToken).expect(404);

    const audit = await prisma.auditLog.findMany({ where: { entityType: 'ClientRoutinePlan', entityId: { in: [assigned.body.id, replaced.body.id] } } });
    expect(audit.map((log) => log.action).sort((a, b) => a.localeCompare(b))).toEqual(['ASSIGN', 'ASSIGN', 'REMOVE', 'UPDATE']);
  });

  it('validates plans', async () => {
    const put = (id: string, body: object) => request(app).put(`/clients/${id}/routine-plan`).set('Authorization', adminToken).send(body);
    await put(clientId, { templateIds: [] }).expect(400);
    await put(clientId, { templateIds: [templateA], nextPosition: 2 }).expect(400);
    await put(inactiveClientId, { templateIds: [templateA] }).expect(400);
    await put('missing-client', { templateIds: [templateA] }).expect(404);

    await request(app).patch(`/routines/${templateB}/status`).set('Authorization', adminToken).send({ status: 'INACTIVE' }).expect(200);
    await put(clientId, { templateIds: [templateA, templateB] }).expect(400);
  });

  it('isolates routines and plans between tenants', async () => {
    await request(app).get(`/routines/${templateA}`).set('Authorization', otherAdminToken).expect(404);
    await request(app).put(`/routines/${templateA}`).set('Authorization', otherAdminToken)
      .send({ name: 'routines-b hack', exercises: [{ exerciseId: exerciseIds[0] }] }).expect(404);
    await request(app).patch(`/routines/${templateA}/status`).set('Authorization', otherAdminToken).send({ status: 'INACTIVE' }).expect(404);
    const list = await request(app).get('/routines?includeInactive=true').set('Authorization', otherAdminToken).expect(200);
    expect(list.body.map((item: { id: string }) => item.id)).not.toContain(templateA);

    await request(app).post('/routines').set('Authorization', otherAdminToken)
      .send({ name: 'routines-b foreign', exercises: [{ exerciseId: exerciseIds[0] }] }).expect(400);

    await request(app).get(`/clients/${clientId}/routine-plan`).set('Authorization', otherAdminToken).expect(404);
    await request(app).put(`/clients/${clientId}/routine-plan`).set('Authorization', otherAdminToken).send({ templateIds: [templateA] }).expect(404);
    await request(app).delete(`/clients/${clientId}/routine-plan`).set('Authorization', otherAdminToken).expect(404);
  });
});
