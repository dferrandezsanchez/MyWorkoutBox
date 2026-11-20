import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { Role } from '../../types/domain';
import { addMembership, createIsolatedTenant } from '../../test/tenant';

const runId = `${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
const password = 'StaffAccess1234!';
let tenantId: string;
let adminId: string;
let trainerId: string;
let adminToken: string;
let trainerToken: string;

async function createStaff(key: string, role: Role): Promise<{ id: string; token: string }> {
  const email = `staff-access-${key}-${runId}@gym.com`;
  const user = await prisma.user.create({
    data: { name: `Staff ${key}`, email, passwordHash: await bcrypt.hash(password, 10), role, active: true },
  });
  await addMembership(user.id, tenantId, role);
  const { body } = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return { id: user.id, token: body.token };
}

const as = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  tenantId = await createIsolatedTenant(`sa${runId}`);
  ({ id: adminId, token: adminToken } = await createStaff('admin', Role.ADMIN));
  ({ id: trainerId, token: trainerToken } = await createStaff('trainer', Role.TRAINER));
});

describe('PATCH /trainers/:id/access', () => {
  it('lists admins and trainers with their role and routine permission', async () => {
    const { body } = await request(app).get('/trainers').set(as(adminToken)).expect(200);

    expect(body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: adminId, role: Role.ADMIN, canManageRoutines: true }),
      expect.objectContaining({ id: trainerId, role: Role.TRAINER, canManageRoutines: false }),
    ]));
    const me = await request(app).get('/auth/me').set(as(trainerToken)).expect(200);
    expect(me.body.canManageRoutines).toBe(false);
  });

  it('is forbidden for trainers', async () => {
    await request(app).patch(`/trainers/${trainerId}/access`).set(as(trainerToken))
      .send({ canManageRoutines: true }).expect(403);
  });

  it('keeps the sole admin and refuses own role changes', async () => {
    const lastAdmin = await request(app).patch(`/trainers/${adminId}/access`).set(as(adminToken))
      .send({ role: Role.TRAINER }).expect(409);
    expect(lastAdmin.body.error).toBe('El centro necesita al menos un administrador activo');
  });

  it('grants the routine permission, reflects it in /auth/me and audits it', async () => {
    const { body } = await request(app).patch(`/trainers/${trainerId}/access`).set(as(adminToken))
      .send({ canManageRoutines: true }).expect(200);
    expect(body).toMatchObject({ id: trainerId, role: Role.TRAINER, canManageRoutines: true });

    const me = await request(app).get('/auth/me').set(as(trainerToken)).expect(200);
    expect(me.body.canManageRoutines).toBe(true);

    const log = await prisma.auditLog.findFirst({
      where: { tenantId, action: 'PERMISSION_CHANGE', userId: adminId },
      orderBy: { createdAt: 'desc' },
    });
    expect(JSON.parse(log!.metadata!)).toMatchObject({
      targetUserId: trainerId, before: { canManageRoutines: false }, after: { canManageRoutines: true },
    });
  });

  it('promotes a trainer whose old token then works on admin routes, and demotion is immediate', async () => {
    await request(app).get('/trainers').set(as(trainerToken)).expect(403);

    await request(app).patch(`/trainers/${trainerId}/access`).set(as(adminToken))
      .send({ role: Role.ADMIN }).expect(200);
    const roleLog = await prisma.auditLog.findFirst({ where: { tenantId, action: 'ROLE_CHANGE', userId: adminId } });
    expect(JSON.parse(roleLog!.metadata!)).toMatchObject({ before: { role: Role.TRAINER }, after: { role: Role.ADMIN } });

    // The promoted user's token still says TRAINER, but authorization reads the membership.
    await request(app).get('/trainers').set(as(trainerToken)).expect(200);

    // Now two admins: the promoted one cannot change their own role…
    const own = await request(app).patch(`/trainers/${trainerId}/access`).set(as(trainerToken))
      .send({ role: Role.TRAINER }).expect(403);
    expect(own.body.error).toBe('No puedes cambiar tu propio rol');

    // …but can demote the original admin, whose still-valid ADMIN token stops working at once.
    await request(app).patch(`/trainers/${adminId}/access`).set(as(trainerToken))
      .send({ role: Role.TRAINER }).expect(200);
    await request(app).get('/trainers').set(as(adminToken)).expect(403);
    await request(app).patch(`/trainers/${trainerId}/access`).set(as(adminToken))
      .send({ role: Role.TRAINER }).expect(403);
  });

  it('prevents an admin from deactivating themselves', async () => {
    const response = await request(app).patch(`/trainers/${trainerId}/status`).set(as(trainerToken))
      .send({ active: false }).expect(400);
    expect(response.body.error).toBe('No puedes desactivar tu propio usuario');
  });

  it('validates the payload and unknown staff', async () => {
    await request(app).patch(`/trainers/${adminId}/access`).set(as(trainerToken)).send({ role: 'OWNER' }).expect(400);
    await request(app).patch(`/trainers/${adminId}/access`).set(as(trainerToken)).send({}).expect(400);
    await request(app).patch('/trainers/unknown-staff-access/access').set(as(trainerToken))
      .send({ canManageRoutines: true }).expect(404);
  });
});
