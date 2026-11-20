import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../index';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PrismaMembershipRepository } from '../../infrastructure/repositories/prisma-repositories';
import { Role } from '../../types/domain';
import { addMembership, createIsolatedTenant } from '../../test/tenant';

const password = 'LastAdmin1234!';
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
let tenantId: string;
let seq = 0;

async function createAdmin(key: string): Promise<{ id: string; token: string }> {
  const email = `last-admin-${key}-${tenantId}@gym.com`;
  const user = await prisma.user.create({
    data: { name: `Admin ${key}`, email, passwordHash: await bcrypt.hash(password, 10), role: Role.ADMIN, active: true },
  });
  await addMembership(user.id, tenantId, Role.ADMIN);
  const { body } = await request(app).post('/auth/login').send({ email, password }).expect(200);
  return { id: user.id, token: body.token };
}

const activeAdmins = () => prisma.userTenantMembership.count({
  where: { tenantId, role: Role.ADMIN, active: true, user: { active: true } },
});

beforeEach(async () => {
  seq += 1;
  tenantId = await createIsolatedTenant(`la${Date.now().toString(36)}${seq}`);
});

describe('last active admin protection', () => {
  it('lets only one of two crossed simultaneous demotions succeed', async () => {
    const a = await createAdmin('a');
    const b = await createAdmin('b');

    const results = await Promise.all([
      request(app).patch(`/trainers/${b.id}/access`).set(as(a.token)).send({ role: Role.TRAINER }),
      request(app).patch(`/trainers/${a.id}/access`).set(as(b.token)).send({ role: Role.TRAINER }),
    ]);

    expect(results.map((r) => r.status).sort((x, y) => x - y)).toEqual([200, 409]);
    expect(await activeAdmins()).toBe(1);
  });

  it('lets only one of two crossed simultaneous deactivations succeed', async () => {
    const a = await createAdmin('a');
    const b = await createAdmin('b');

    const results = await Promise.all([
      request(app).patch(`/trainers/${b.id}/status`).set(as(a.token)).send({ active: false }),
      request(app).patch(`/trainers/${a.id}/status`).set(as(b.token)).send({ active: false }),
    ]);

    expect(results.map((r) => r.status).sort((x, y) => x - y)).toEqual([200, 409]);
    expect(await activeAdmins()).toBe(1);
  });

  it('does not deactivate the user when the membership change is rejected', async () => {
    const a = await createAdmin('a');
    const b = await createAdmin('b');
    await request(app).patch(`/trainers/${b.id}/status`).set(as(a.token)).send({ active: false }).expect(200);

    // b is gone, so a is now the only admin; the repository guard rejects removing it.
    const memberships = new PrismaMembershipRepository();
    await expect(memberships.updateActive(a.id, tenantId, false)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(memberships.updateAccess(a.id, tenantId, { role: Role.TRAINER })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await activeAdmins()).toBe(1);
  });

  it('still allows changes in a tenant that has no active admin', async () => {
    const trainer = await prisma.user.create({
      data: { name: 'Trainer', email: `last-admin-t-${tenantId}@gym.com`, passwordHash: 'x', role: Role.TRAINER, active: true },
    });
    await addMembership(trainer.id, tenantId, Role.TRAINER);

    await expect(new PrismaMembershipRepository().updateActive(trainer.id, tenantId, false)).resolves.toBeUndefined();
  });
});
