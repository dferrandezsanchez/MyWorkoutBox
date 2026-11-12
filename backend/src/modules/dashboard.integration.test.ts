import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../index';
import prisma from '../infrastructure/prisma/prisma-client';
import { Role } from '../types/domain';
import { ensureTenantMembership } from '../test/tenant';

const runId = Date.now();
const password = 'Dashboard1234!';
let adminToken: string;
let trainerToken: string;

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

beforeAll(async () => {
  adminToken = await createUserAndLogin(`dashboard-admin-${runId}@gym.com`, Role.ADMIN);
  trainerToken = await createUserAndLogin(`dashboard-trainer-${runId}@gym.com`, Role.TRAINER);
});

describe('GET /dashboard/overview', () => {
  it('returns the center activity overview to admins', async () => {
    const { body } = await request(app)
      .get('/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(body.period.days).toBe(28);
    expect(body.daily).toHaveLength(28);
    expect(body.totals).toEqual(expect.objectContaining({ completedSessions: expect.any(Number), series: expect.any(Number) }));
    expect(Array.isArray(body.activeSessions)).toBe(true);
    expect(Array.isArray(body.trainers)).toBe(true);
    expect(Array.isArray(body.recentSessions)).toBe(true);
    expect(Array.isArray(body.clientsToReactivate)).toBe(true);
  });

  it('is forbidden for trainers and requires authentication', async () => {
    await request(app).get('/dashboard/overview').set('Authorization', `Bearer ${trainerToken}`).expect(403);
    await request(app).get('/dashboard/overview').expect(401);
  });
});
