import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../index';
import prisma from '../infrastructure/prisma/prisma-client';
import { PerformanceUnit, Role, Status } from '../types/domain';
import { ensureTenantMembership, TEST_TENANT_ID } from '../test/tenant';

const runId = Date.now();
const adminEmail = `prod-admin-${runId}@gym.com`;
const trainerEmail = `prod-trainer-${runId}@gym.com`;
const adminPassword = 'ProdAdmin1234!';
const trainerPassword = 'ProdTrainer1234!';

let adminToken: string;
let trainerToken: string;
let clientId: string;
let exerciseId: string;

async function createUser(email: string, password: string, role: Role, name: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, active: true },
    create: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      active: true,
    },
  });
  await ensureTenantMembership(user.id, role);
  return user;
}

async function login(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  expect(response.body.user.email).toBe(email);
  expect(response.body.user.tenantId).toBe(TEST_TENANT_ID);
  expect(response.body.token).toEqual(expect.any(String));
  return response.body.token;
}

beforeAll(async () => {
  await createUser(adminEmail, adminPassword, Role.ADMIN, 'Production Admin');
  await createUser(trainerEmail, trainerPassword, Role.TRAINER, 'Production Trainer');
  adminToken = await login(adminEmail, adminPassword);
  trainerToken = await login(trainerEmail, trainerPassword);
});

describe('production readiness API flow', () => {
  it('exposes health and authenticated tenant context', async () => {
    await request(app)
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });

    await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(adminEmail);
        expect(body.role).toBe(Role.ADMIN);
      });

    await request(app)
      .get('/auth/tenant')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(TEST_TENANT_ID);
      });
  });

  it('enforces admin-only writes and supports client/exercise setup', async () => {
    await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        firstName: 'Forbidden',
        lastName: 'Trainer',
        birthDate: '1990-01-01',
      })
      .expect(403);

    const clientResponse = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Production',
        lastName: `Client ${runId}`,
        birthDate: '1990-01-01',
        height: 172,
        weight: 70,
        notes: 'Created by production readiness test',
      })
      .expect(201);

    clientId = clientResponse.body.id;
    expect(clientResponse.body.tenantId).toBe(TEST_TENANT_ID);

    const exerciseResponse = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Production Exercise ${runId}`,
        category: 'strength',
        movementPattern: 'hinge',
        evaluationType: 'weight_reps',
        improvementDirection: 'higher',
        defaultUnit: PerformanceUnit.kg,
        measurementFields: [
          { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
          { key: 'repetitions', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true },
        ],
        variantGroups: [],
        status: Status.ACTIVE,
      })
      .expect(201);

    exerciseId = exerciseResponse.body.id;
    expect(exerciseResponse.body.tenantId).toBe(TEST_TENANT_ID);
  });

  it('supports trainer performance creation, current marks and ordered history', async () => {
    await request(app)
      .post(`/clients/${clientId}/exercises/${exerciseId}/performances`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        value: 100,
        unit: PerformanceUnit.kg,
        repetitions: 5,
        date: '2026-06-01',
      })
      .expect(201);

    await request(app)
      .post(`/clients/${clientId}/exercises/${exerciseId}/performances`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({
        value: 110,
        unit: PerformanceUnit.kg,
        repetitions: 3,
        date: '2026-06-02',
      })
      .expect(201);

    await request(app)
      .get(`/clients/${clientId}/current-performances`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const mark = body.find((item: { exerciseId: string }) => item.exerciseId === exerciseId);
        expect(mark.record.value).toBe('110');
      });

    await request(app)
      .get(`/clients/${clientId}/exercises/${exerciseId}/performances`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((record: { value: string }) => record.value)).toEqual(['110', '100']);
      });
  });

  it('supports RGPD export and anonymization over HTTP', async () => {
    await request(app)
      .get(`/clients/${clientId}/export`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.client.id).toBe(clientId);
        expect(body.performances).toHaveLength(2);
      });

    await request(app)
      .post(`/clients/${clientId}/anonymize`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.firstName).toBe('ANONIMIZADO');
        expect(body.notes).toBeNull();
        expect(body.anonymizedAt).toBeTruthy();
      });
  });
});
