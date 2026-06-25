import { beforeAll, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../infrastructure/prisma/prisma-client';
import { authorize } from '../interfaces/http/middleware/authorize';
import { PerformanceUnit, Role, Status } from '../types/domain';
import { createContainer } from '../main/container';
import { ensureTenantMembership, TEST_ORGANIZATION_ID, TEST_TENANT_ID } from '../test/tenant';

let adminUserId: string;
let trainerUserId: string;

function mockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

beforeAll(async () => {
  const admin = await prisma.user.upsert({
    where: { email: 'access-admin@gym.com' },
    update: { role: Role.ADMIN, active: true },
    create: {
      name: 'Access Admin',
      email: 'access-admin@gym.com',
      passwordHash: await bcrypt.hash('AccessAdmin1234!', 10),
      role: Role.ADMIN,
      active: true,
    },
  });
  adminUserId = admin.id;
  await ensureTenantMembership(admin.id, Role.ADMIN);

  const trainer = await prisma.user.upsert({
    where: { email: 'access-trainer@gym.com' },
    update: { role: Role.TRAINER, active: true },
    create: {
      name: 'Access Trainer',
      email: 'access-trainer@gym.com',
      passwordHash: await bcrypt.hash('AccessTrainer1234!', 10),
      role: Role.TRAINER,
      active: true,
    },
  });
  trainerUserId = trainer.id;
  await ensureTenantMembership(trainer.id, Role.TRAINER);
});

describe('role based access control', () => {
  it('blocks TRAINER from admin client operations before the service runs', () => {
    // Feature: control-marcas-entrenamiento, Property 6: Control de acceso — TRAINER no puede hacer operaciones de ADMIN (clientes)
    const middleware = authorize(Role.ADMIN);
    const req = { user: { userId: trainerUserId, tenantId: TEST_TENANT_ID, organizationId: TEST_ORGANIZATION_ID, role: Role.TRAINER } };
    const res = mockResponse();
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Permisos insuficientes' });
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks TRAINER from admin exercise operations before the service runs', () => {
    // Feature: control-marcas-entrenamiento, Property 6: Control de acceso — TRAINER no puede hacer operaciones de ADMIN (ejercicios)
    const middleware = authorize(Role.ADMIN);
    const req = { user: { userId: trainerUserId, tenantId: TEST_TENANT_ID, organizationId: TEST_ORGANIZATION_ID, role: Role.TRAINER } };
    const res = mockResponse();
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Permisos insuficientes' });
    expect(next).not.toHaveBeenCalled();
  });

  it('supports the client admin flow create, list, update and deactivate', async () => {
    const clientsUseCases = createContainer().clients;
    const client = await clientsUseCases.create.execute(
      TEST_TENANT_ID,
      {
        firstName: 'Integration',
        lastName: 'Client',
        birthDate: '1991-02-03',
        height: 175,
      },
      adminUserId,
    );

    const listed = await clientsUseCases.list.execute(TEST_TENANT_ID, 'Integration');
    expect(listed.some((item) => item.id === client.id)).toBe(true);

    const updated = await clientsUseCases.update.execute(TEST_TENANT_ID, client.id, { firstName: 'Integration Updated' }, adminUserId);
    expect(updated.firstName).toBe('Integration Updated');

    const inactive = await clientsUseCases.setStatus.execute(TEST_TENANT_ID, client.id, Status.INACTIVE, adminUserId);
    expect(inactive.status).toBe(Status.INACTIVE);
  });

  it('creates a performance and exposes current mark plus ordered history', async () => {
    const container = createContainer();
    const client = await container.clients.create.execute(
      TEST_TENANT_ID,
      {
        firstName: 'Performance Flow',
        lastName: 'Client',
        birthDate: '1991-02-03',
      },
      adminUserId,
    );

    const exercise = await container.exercises.create.execute(TEST_TENANT_ID, {
      name: `Performance Flow Exercise ${Date.now()}`,
      category: 'Test',
      defaultUnit: PerformanceUnit.kg,
      status: Status.ACTIVE,
    });

    await container.performances.create.execute(TEST_TENANT_ID, client.id, exercise.id, trainerUserId, {
      value: 100,
      unit: PerformanceUnit.kg,
      date: '2026-06-01',
    });
    await container.performances.create.execute(TEST_TENANT_ID, client.id, exercise.id, trainerUserId, {
      value: 110,
      unit: PerformanceUnit.kg,
      date: '2026-06-02',
    });

    const currentMarks = await container.performances.getCurrentMarks.execute(TEST_TENANT_ID, client.id);
    const current = currentMarks.find((mark) => mark.exerciseId === exercise.id);
    expect(current?.record?.value).toBe('110');

    const history = await container.performances.getHistory.execute(TEST_TENANT_ID, client.id, exercise.id);
    expect(history.map((record) => record.value)).toEqual(['110', '100']);
  });
});
