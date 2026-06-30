import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PerformanceUnit, Role, Status, TrainingSessionStatus } from '../../types/domain';
import { createContainer } from '../../main/container';
import { ensureTenantMembership, TEST_TENANT_ID } from '../../test/tenant';

let adminUserId: string;
let clientId: string;
let exerciseId: string;

beforeAll(async () => {
  const admin = await prisma.user.upsert({
    where: { email: 'rgpd-admin@gym.com' },
    update: { role: Role.ADMIN, active: true },
    create: {
      name: 'RGPD Admin',
      email: 'rgpd-admin@gym.com',
      passwordHash: await bcrypt.hash('RgpdAdmin1234!', 10),
      role: Role.ADMIN,
      active: true,
    },
  });
  adminUserId = admin.id;
  await ensureTenantMembership(admin.id, Role.ADMIN);

  const client = await prisma.client.create({
    data: {
      tenantId: TEST_TENANT_ID,
      firstName: 'RGPD',
      lastName: 'Client',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      notes: 'Sensitive note',
      status: Status.ACTIVE,
    },
  });
  clientId = client.id;

  const exercise = await prisma.exercise.create({
    data: {
      tenantId: TEST_TENANT_ID,
      name: `RGPD Exercise ${Date.now()}`,
      category: 'Test',
      defaultUnit: PerformanceUnit.kg,
      measurementFields: JSON.stringify([
        { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      ]),
      variantGroups: '[]',
      status: Status.ACTIVE,
    },
  });
  exerciseId = exercise.id;

  await prisma.performanceRecord.create({
    data: {
      tenantId: TEST_TENANT_ID,
      clientId,
      exerciseId,
      trainerId: adminUserId,
      value: '100',
      unit: PerformanceUnit.kg,
      date: new Date('2026-06-01T00:00:00.000Z'),
    },
  });

  await prisma.trainingSession.create({
    data: {
      tenantId: TEST_TENANT_ID,
      clientId,
      trainerId: adminUserId,
      status: TrainingSessionStatus.COMPLETED,
      startedAt: new Date('2026-06-01T09:00:00.000Z'),
      completedAt: new Date('2026-06-01T10:00:00.000Z'),
    },
  });
});

describe('RGPD client service', () => {
  it('exports personal data, performances and training sessions', async () => {
    const exported = await createContainer().clients.exportData.execute(TEST_TENANT_ID, clientId, adminUserId);

    expect(exported.client.id).toBe(clientId);
    expect(exported.performances).toHaveLength(1);
    expect(exported.trainingSessions).toHaveLength(1);
  });

  it('anonymizes personal fields and preserves performances', async () => {
    const countBefore = await prisma.performanceRecord.count({ where: { clientId } });

    const updated = await createContainer().clients.anonymize.execute(TEST_TENANT_ID, clientId, adminUserId);
    const countAfter = await prisma.performanceRecord.count({ where: { clientId } });
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: clientId, action: 'ANONYMIZE' },
    });

    expect(updated.firstName).toBe('ANONIMIZADO');
    expect(updated.lastName).toBe('');
    expect(updated.notes).toBeNull();
    expect(updated.anonymizedAt).toBeTruthy();
    expect(countAfter).toBe(countBefore);
    expect(auditLog).toBeTruthy();
  });
});
