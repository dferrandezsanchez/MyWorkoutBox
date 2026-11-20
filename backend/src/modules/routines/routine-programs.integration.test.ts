import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role } from '../../types/domain';
import { addMembership, createIsolatedTenant } from '../../test/tenant';

const runId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
const password = 'ProgramsP1234!';
let tenantId: string;
let adminToken: string;
let trainerToken: string;
let managerToken: string;
let otherAdminToken: string;
let templateIds: string[];
let archivedTemplateId: string;
let foreignTemplateId: string;
let clientIds: string[];
let inactiveClientId: string;

async function createUser(prefix: string, role: Role) {
  const email = `programs-${prefix}-${runId}@gym.com`;
  return prisma.user.create({
    data: { name: `programs ${prefix}`, email, passwordHash: await bcrypt.hash(password, 10), role, active: true },
  });
}

async function login(email: string): Promise<string> {
  const response = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return `Bearer ${response.body.token}`;
}

async function createTemplate(tenant: string, name: string, createdById: string, status = 'ACTIVE') {
  const exercise = await prisma.exercise.create({
    data: { tenantId: tenant, name: `${name} ex`, category: 'strength', defaultUnit: 'kg', measurementFields: '[]', variantGroups: '[]' },
  });
  return prisma.routineTemplate.create({
    data: { tenantId: tenant, name, createdById, status, exercises: { create: [{ exerciseId: exercise.id, position: 1 }] } },
  });
}

async function createClient(tenant: string, firstName: string, status = 'ACTIVE') {
  return prisma.client.create({
    data: { tenantId: tenant, firstName, lastName: `Programa ${runId}`, birthDate: new Date('1990-01-01T00:00:00.000Z'), status },
  });
}

beforeAll(async () => {
  tenantId = await createIsolatedTenant(`prg_${runId}`);
  const otherTenantId = await createIsolatedTenant(`prgx_${runId}`);

  const admin = await createUser('admin', Role.ADMIN);
  await addMembership(admin.id, tenantId, Role.ADMIN);
  const trainer = await createUser('trainer', Role.TRAINER);
  await addMembership(trainer.id, tenantId, Role.TRAINER);
  const manager = await createUser('manager', Role.TRAINER);
  await addMembership(manager.id, tenantId, Role.TRAINER);
  await prisma.userTenantMembership.update({
    where: { userId_tenantId: { userId: manager.id, tenantId } },
    data: { canManageRoutines: true },
  });
  const otherAdmin = await createUser('other', Role.ADMIN);
  await addMembership(otherAdmin.id, otherTenantId, Role.ADMIN);

  templateIds = (await Promise.all(['A', 'B', 'C'].map((letter) => createTemplate(tenantId, `programs ${letter}`, admin.id)))).map((item) => item.id);
  archivedTemplateId = (await createTemplate(tenantId, 'programs old', admin.id, 'INACTIVE')).id;
  foreignTemplateId = (await createTemplate(otherTenantId, 'programs foreign', otherAdmin.id)).id;
  clientIds = (await Promise.all(['Zoe', 'Ana', 'Leo'].map((name) => createClient(tenantId, name)))).map((item) => item.id);
  inactiveClientId = (await createClient(tenantId, 'Baja', 'INACTIVE')).id;

  [adminToken, trainerToken, managerToken, otherAdminToken] = await Promise.all([
    login(admin.email),
    login(trainer.email),
    login(manager.email),
    login(otherAdmin.email),
  ]);
});

describe('routine programs', () => {
  let programId: string;
  let otherProgramId: string;
  const [a, b, c] = [0, 1, 2];

  it('lets routine managers create, read and replace programs with ordered templates', async () => {
    const created = await request(app).post('/routine-programs').set('Authorization', adminToken).send({
      name: '  Fuerza 3 días ',
      notes: 'Lunes, miércoles y viernes',
      templateIds: [templateIds[a], templateIds[b], templateIds[c]],
    }).expect(201);
    programId = created.body.id;
    expect(created.body).toMatchObject({ name: 'Fuerza 3 días', notes: 'Lunes, miércoles y viernes', status: 'ACTIVE', activeClientCount: 0 });
    expect(created.body.items.map((item: { templateId: string; position: number }) => [item.templateId, item.position]))
      .toEqual([[templateIds[a], 1], [templateIds[b], 2], [templateIds[c], 3]]);
    expect(created.body.items[0].template.exercises).toHaveLength(1);

    const byManager = await request(app).post('/routine-programs').set('Authorization', managerToken)
      .send({ name: 'Fuerza 2 días', templateIds: [templateIds[a], templateIds[b], templateIds[a]] }).expect(201);
    otherProgramId = byManager.body.id;

    const updated = await request(app).put(`/routine-programs/${otherProgramId}`).set('Authorization', managerToken)
      .send({ name: 'Fuerza 2 días', templateIds: [templateIds[b], templateIds[a]] }).expect(200);
    expect(updated.body.notes).toBeNull();
    expect(updated.body.items.map((item: { templateId: string }) => item.templateId)).toEqual([templateIds[b], templateIds[a]]);

    const fetched = await request(app).get(`/routine-programs/${programId}`).set('Authorization', trainerToken).expect(200);
    expect(fetched.body.items).toHaveLength(3);
    const list = await request(app).get('/routine-programs').set('Authorization', trainerToken).expect(200);
    expect(list.body.map((item: { name: string }) => item.name)).toEqual(['Fuerza 2 días', 'Fuerza 3 días']);

    const audit = await prisma.auditLog.findMany({ where: { entityType: 'RoutineProgram', entityId: otherProgramId } });
    expect(audit.map((log) => log.action).sort((left, right) => left.localeCompare(right))).toEqual(['CREATE', 'UPDATE']);
  });

  it('validates programs', async () => {
    const post = (body: object) => request(app).post('/routine-programs').set('Authorization', adminToken).send(body);
    await post({ name: '', templateIds: [templateIds[a]] }).expect(400);
    await post({ name: 'x'.repeat(192), templateIds: [templateIds[a]] }).expect(400);
    await post({ name: 'P', notes: 'x'.repeat(2001), templateIds: [templateIds[a]] }).expect(400);
    await post({ name: 'P', templateIds: [] }).expect(400);
    await post({ name: 'P', templateIds: Array.from({ length: 11 }, () => templateIds[a]) }).expect(400);
    await post({ name: 'P', templateIds: [archivedTemplateId] }).expect(400);
    await post({ name: 'P', templateIds: [foreignTemplateId] }).expect(400);
    await request(app).put('/routine-programs/missing').set('Authorization', adminToken).send({ name: 'P', templateIds: [templateIds[a]] }).expect(404);
    await request(app).get('/routine-programs/missing').set('Authorization', adminToken).expect(404);
  });

  it('only lets routine managers write programs', async () => {
    await request(app).post('/routine-programs').set('Authorization', trainerToken).send({ name: 'P', templateIds: [templateIds[a]] }).expect(403);
    await request(app).put(`/routine-programs/${programId}`).set('Authorization', trainerToken).send({ name: 'P', templateIds: [templateIds[a]] }).expect(403);
    await request(app).patch(`/routine-programs/${programId}/status`).set('Authorization', trainerToken).send({ status: 'INACTIVE' }).expect(403);
    await request(app).put(`/clients/${clientIds[0]}/routine-plan`).set('Authorization', trainerToken).send({ programId }).expect(403);
    await request(app).get('/routine-programs').expect(401);
  });

  it('assigns a program to clients who then follow it live', async () => {
    const assigned = await request(app).put(`/clients/${clientIds[0]}/routine-plan`).set('Authorization', managerToken)
      .send({ programId, nextPosition: 3 }).expect(200);
    expect(assigned.body).toMatchObject({ name: 'Fuerza 3 días', programId, nextPosition: 3, program: { id: programId, name: 'Fuerza 3 días', status: 'ACTIVE' } });
    expect(assigned.body.items.map((item: { templateId: string; planId: string }) => [item.templateId, item.planId]))
      .toEqual(templateIds.map((id) => [id, assigned.body.id]));
    await request(app).put(`/clients/${clientIds[1]}/routine-plan`).set('Authorization', adminToken).send({ programId }).expect(200);
    await request(app).put(`/clients/${clientIds[2]}/routine-plan`).set('Authorization', adminToken)
      .send({ name: 'Propia', templateIds: [templateIds[c], templateIds[a]] }).expect(200);

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { entityType: 'ClientRoutinePlan', entityId: assigned.body.id } });
    expect(JSON.parse(audit.metadata ?? '{}')).toMatchObject({ clientId: clientIds[0], programId, nextPosition: 3 });

    const followers = await request(app).get(`/routine-programs/${programId}/clients`).set('Authorization', trainerToken).expect(200);
    expect(followers.body).toEqual([
      { clientId: clientIds[1], firstName: 'Ana', lastName: `Programa ${runId}`, nextPosition: 1 },
      { clientId: clientIds[0], firstName: 'Zoe', lastName: `Programa ${runId}`, nextPosition: 3 },
    ]);
    const program = await request(app).get(`/routine-programs/${programId}`).set('Authorization', trainerToken).expect(200);
    expect(program.body.activeClientCount).toBe(2);

    const next = await request(app).patch(`/clients/${clientIds[1]}/routine-plan/next`).set('Authorization', adminToken).send({ nextPosition: 3 }).expect(200);
    expect(next.body.nextPosition).toBe(3);
    await request(app).patch(`/clients/${clientIds[1]}/routine-plan/next`).set('Authorization', adminToken).send({ nextPosition: 4 }).expect(400);
  });

  it('validates program assignments', async () => {
    const put = (id: string, body: object) => request(app).put(`/clients/${id}/routine-plan`).set('Authorization', adminToken).send(body);
    await put(clientIds[2], { programId, templateIds: [templateIds[a]] }).expect(400);
    await put(clientIds[2], { programId, nextPosition: 4 }).expect(400);
    await put(clientIds[2], { programId: 'missing' }).expect(400);
    await put(clientIds[2], { programId: '' }).expect(400);
    await put(inactiveClientId, { programId }).expect(400);
    const plan = await request(app).get(`/clients/${clientIds[2]}/routine-plan`).set('Authorization', adminToken).expect(200);
    expect(plan.body).toMatchObject({ name: 'Propia', programId: null, program: null });
  });

  it('shows program edits to every follower and restarts those beyond the new length', async () => {
    await request(app).put(`/routine-programs/${programId}`).set('Authorization', adminToken)
      .send({ name: 'Fuerza 2 días bis', templateIds: [templateIds[c], templateIds[b]] }).expect(200);

    const zoe = await request(app).get(`/clients/${clientIds[0]}/routine-plan`).set('Authorization', trainerToken).expect(200);
    expect(zoe.body.nextPosition).toBe(1);
    expect(zoe.body.program.name).toBe('Fuerza 2 días bis');
    expect(zoe.body.items.map((item: { templateId: string }) => item.templateId)).toEqual([templateIds[c], templateIds[b]]);
    const followers = await request(app).get(`/routine-programs/${programId}/clients`).set('Authorization', trainerToken).expect(200);
    expect(followers.body.map((item: { nextPosition: number }) => item.nextPosition)).toEqual([1, 1]);

    const custom = await request(app).get(`/clients/${clientIds[2]}/routine-plan`).set('Authorization', trainerToken).expect(200);
    expect(custom.body.items.map((item: { templateId: string }) => item.templateId)).toEqual([templateIds[c], templateIds[a]]);
  });

  it('archives a program without breaking clients already following it', async () => {
    const archived = await request(app).patch(`/routine-programs/${programId}/status`).set('Authorization', managerToken)
      .send({ status: 'INACTIVE' }).expect(200);
    expect(archived.body.status).toBe('INACTIVE');
    await request(app).patch(`/routine-programs/${programId}/status`).set('Authorization', managerToken).send({ status: 'BAD' }).expect(400);

    const active = await request(app).get('/routine-programs').set('Authorization', trainerToken).expect(200);
    expect(active.body.map((item: { id: string }) => item.id)).not.toContain(programId);
    const all = await request(app).get('/routine-programs?includeInactive=true').set('Authorization', trainerToken).expect(200);
    expect(all.body.map((item: { id: string }) => item.id)).toContain(programId);

    const plan = await request(app).get(`/clients/${clientIds[0]}/routine-plan`).set('Authorization', trainerToken).expect(200);
    expect(plan.body).toMatchObject({ programId, program: { status: 'INACTIVE' } });
    expect(plan.body.items).toHaveLength(2);
    await request(app).patch(`/clients/${clientIds[0]}/routine-plan/next`).set('Authorization', adminToken).send({ nextPosition: 2 }).expect(200);
    await request(app).put(`/clients/${clientIds[2]}/routine-plan`).set('Authorization', adminToken).send({ programId }).expect(400);

    const audit = await prisma.auditLog.findMany({ where: { entityType: 'RoutineProgram', entityId: programId, action: 'STATUS' } });
    expect(audit).toHaveLength(1);
    await request(app).patch(`/routine-programs/${programId}/status`).set('Authorization', adminToken).send({ status: 'ACTIVE' }).expect(200);
  });

  it('isolates programs between tenants', async () => {
    await request(app).get(`/routine-programs/${programId}`).set('Authorization', otherAdminToken).expect(404);
    await request(app).get(`/routine-programs/${programId}/clients`).set('Authorization', otherAdminToken).expect(404);
    await request(app).put(`/routine-programs/${programId}`).set('Authorization', otherAdminToken)
      .send({ name: 'hack', templateIds: [foreignTemplateId] }).expect(404);
    await request(app).patch(`/routine-programs/${programId}/status`).set('Authorization', otherAdminToken).send({ status: 'INACTIVE' }).expect(404);
    const list = await request(app).get('/routine-programs?includeInactive=true').set('Authorization', otherAdminToken).expect(200);
    expect(list.body.map((item: { id: string }) => item.id)).not.toContain(programId);

    await request(app).post('/routine-programs').set('Authorization', otherAdminToken)
      .send({ name: 'foreign', templateIds: [templateIds[a]] }).expect(400);
    const otherClient = await createClient(`tenant_prgx_${runId}`, 'Foreign');
    await request(app).put(`/clients/${otherClient.id}/routine-plan`).set('Authorization', otherAdminToken).send({ programId }).expect(400);
    await request(app).put(`/clients/${clientIds[0]}/routine-plan`).set('Authorization', otherAdminToken).send({ programId }).expect(404);
  });
});
