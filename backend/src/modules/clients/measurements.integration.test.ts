import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role } from '../../types/domain';
import { addMembership, createIsolatedTenant, ensureTenantMembership } from '../../test/tenant';

const runId = Date.now();
const password = 'Measure1234!';
let adminToken: string;
let trainerToken: string;
let clientId: string;

async function createUserAndLogin(email: string, role: Role): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, active: true },
    create: { name: email, email, passwordHash: await bcrypt.hash(password, 10), role, active: true },
  });
  await ensureTenantMembership(user.id, role);
  const response = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return response.body.token;
}

const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);
const asTrainer = (req: request.Test) => req.set('Authorization', `Bearer ${trainerToken}`);

beforeAll(async () => {
  adminToken = await createUserAndLogin(`measure-admin-${runId}@gym.com`, Role.ADMIN);
  trainerToken = await createUserAndLogin(`measure-trainer-${runId}@gym.com`, Role.TRAINER);
});

describe('client measurements and goal', () => {
  it('creates a client with a goal and a first measurement', async () => {
    const { body } = await asAdmin(request(app).post('/clients')).send({
      firstName: 'Medida',
      lastName: `Test ${runId}`,
      birthDate: '1990-04-12',
      height: 175,
      goal: 'Bajar a 75 kg para la boda',
      goalDate: '2027-06-12',
      initialMeasurement: { measuredAt: '2026-11-03', weight: 82.4, bodyFatPercentage: 21.3, muscleMass: 33.8 },
    }).expect(201);

    clientId = body.id;
    expect(body.goal).toBe('Bajar a 75 kg para la boda');
    expect(body.goalDate).toBe('2027-06-12T12:00:00.000Z');

    const list = await asTrainer(request(app).get(`/clients/${clientId}/measurements`)).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ weight: 82.4, bodyFatPercentage: 21.3, muscleMass: 33.8 });
  });

  it('lets trainers add, correct and delete measurements, newest first', async () => {
    const created = await asTrainer(request(app).post(`/clients/${clientId}/measurements`))
      .send({ measuredAt: '2026-11-17', weight: 81.1, muscleMass: 34.2 })
      .expect(201);

    const list = await asTrainer(request(app).get(`/clients/${clientId}/measurements`)).expect(200);
    expect(list.body.map((item: { measuredAt: string }) => item.measuredAt.slice(0, 10))).toEqual(['2026-11-17', '2026-11-03']);

    const updated = await asTrainer(request(app).put(`/clients/${clientId}/measurements/${created.body.id}`))
      .send({ measuredAt: '2026-11-17', weight: 80.9, muscleMass: 34.2 })
      .expect(200);
    expect(updated.body.weight).toBeCloseTo(80.9);

    await asTrainer(request(app).delete(`/clients/${clientId}/measurements/${created.body.id}`)).expect(204);
    const after = await asTrainer(request(app).get(`/clients/${clientId}/measurements`)).expect(200);
    expect(after.body).toHaveLength(1);
  });

  it('validates measurements', async () => {
    await asTrainer(request(app).post(`/clients/${clientId}/measurements`)).send({ measuredAt: '2026-11-17' }).expect(400);
    await asTrainer(request(app).post(`/clients/${clientId}/measurements`)).send({ measuredAt: '2026-11-17', weight: 900 }).expect(400);
  });

  it('lets trainers update the goal', async () => {
    const { body } = await asTrainer(request(app).patch(`/clients/${clientId}/goal`))
      .send({ goal: 'Media maratón de Valencia', goalDate: '2027-03-21' })
      .expect(200);
    expect(body.goal).toBe('Media maratón de Valencia');

    const cleared = await asTrainer(request(app).patch(`/clients/${clientId}/goal`)).send({ goal: '', goalDate: null }).expect(200);
    expect(cleared.body.goal).toBeNull();
    expect(cleared.body.goalDate).toBeNull();
  });

  it('hides measurements when the center disables the feature', async () => {
    const tenantId = await createIsolatedTenant(`measure_off_${runId}`, { measurementsEnabled: false });
    const email = `measure-off-${runId}@gym.com`;
    const user = await prisma.user.create({
      data: { name: email, email, passwordHash: await bcrypt.hash(password, 10), role: Role.TRAINER, active: true },
    });
    await addMembership(user.id, tenantId, Role.TRAINER);
    const client = await prisma.client.create({
      data: { tenantId, firstName: 'Sin', lastName: 'Mediciones', birthDate: new Date('1990-01-01T00:00:00.000Z') },
    });
    const { body } = await request(app).post('/auth/login').send({ email, password }).expect(200);
    const token = `Bearer ${body.token}`;

    await request(app).get(`/clients/${client.id}/measurements`).set('Authorization', token).expect(403);
    await request(app).post(`/clients/${client.id}/measurements`).set('Authorization', token).send({ measuredAt: '2026-11-17', weight: 80 }).expect(403);
  });

  it('includes measurements in the GDPR export and removes them on anonymization', async () => {
    const exported = await asAdmin(request(app).get(`/clients/${clientId}/export`)).expect(200);
    expect(exported.body.measurements).toHaveLength(1);

    await asAdmin(request(app).post(`/clients/${clientId}/anonymize`)).expect(200);
    expect(await prisma.clientMeasurement.count({ where: { clientId } })).toBe(0);
    const anonymized = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    expect(anonymized.goal).toBeNull();
    expect(anonymized.goalDate).toBeNull();
  });

  it('returns 404 for measurements of unknown clients', async () => {
    await asTrainer(request(app).get('/clients/unknown-client/measurements')).expect(404);
  });
});
