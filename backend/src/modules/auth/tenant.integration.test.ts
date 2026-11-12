import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role } from '../../types/domain';
import { ensureTenantMembership, TEST_TENANT_ID } from '../../test/tenant';

const runId = Date.now();
const adminEmail = `tenant-admin-${runId}@gym.com`;
const trainerEmail = `tenant-trainer-${runId}@gym.com`;
const password = 'TenantTest1234!';
const TENANT_KEYS = ['id', 'organizationId', 'name', 'slug'];

let adminToken: string;
let trainerToken: string;
let originalName: string;

async function createUser(email: string, role: Role) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, active: true },
    create: { name: email, email, passwordHash: await bcrypt.hash(password, 10), role, active: true },
  });
  await ensureTenantMembership(user.id, role);
}

async function login(email: string): Promise<string> {
  const response = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return response.body.token;
}

beforeAll(async () => {
  await createUser(adminEmail, Role.ADMIN);
  await createUser(trainerEmail, Role.TRAINER);
  adminToken = await login(adminEmail);
  trainerToken = await login(trainerEmail);
  originalName = (await prisma.tenant.findUniqueOrThrow({ where: { id: TEST_TENANT_ID } })).name;
});

afterAll(async () => {
  await prisma.tenant.update({ where: { id: TEST_TENANT_ID }, data: { name: originalName } });
});

describe('active tenant API', () => {
  it('returns the tenant context without per-tenant branding', async () => {
    const { body } = await request(app)
      .get('/auth/tenant')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Object.keys(body)).toEqual(expect.arrayContaining(TENANT_KEYS));
    expect(Object.keys(body)).toHaveLength(TENANT_KEYS.length);
    expect(body.id).toBe(TEST_TENANT_ID);
  });

  it('does not expose branding in the login response', async () => {
    const { body } = await request(app)
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);

    expect(Object.keys(body.tenant)).toEqual(expect.arrayContaining(TENANT_KEYS));
    expect(Object.keys(body.tenant)).toHaveLength(TENANT_KEYS.length);
  });

  it('only lets admins rename the tenant', async () => {
    await request(app)
      .put('/auth/tenant')
      .set('Authorization', `Bearer ${trainerToken}`)
      .send({ name: 'Trainer rename' })
      .expect(403);
  });

  it('renames the tenant and ignores legacy branding fields', async () => {
    const before = await prisma.tenant.findUniqueOrThrow({ where: { id: TEST_TENANT_ID } });

    const { body } = await request(app)
      .put('/auth/tenant')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '  Renamed Center  ', primary: '#000000', appName: 'Other brand' })
      .expect(200);

    expect(body.name).toBe('Renamed Center');

    const after = await prisma.tenant.findUniqueOrThrow({ where: { id: TEST_TENANT_ID } });
    expect(after.name).toBe('Renamed Center');
    expect(after.primary).toBe(before.primary);
    expect(after.appName).toBe(before.appName);
  });

  it('rejects an empty name', async () => {
    await request(app)
      .put('/auth/tenant')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '   ' })
      .expect(400);
  });
});
