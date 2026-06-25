import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PerformanceUnit, Role, Status } from '../../types/domain';
import { createContainer } from '../../main/container';
import { ensureTenantMembership, TEST_TENANT_ID } from '../../test/tenant';

let clientId: string;
let exerciseId: string;
let trainerId: string;

beforeAll(async () => {
  const trainer = await prisma.user.upsert({
    where: { email: 'performances-test@gym.com' },
    update: { role: Role.TRAINER, active: true },
    create: {
      name: 'Performances Test',
      email: 'performances-test@gym.com',
      passwordHash: await bcrypt.hash('Performances1234!', 10),
      role: Role.TRAINER,
      active: true,
    },
  });
  trainerId = trainer.id;
  await ensureTenantMembership(trainer.id, Role.TRAINER);

  const client = await prisma.client.create({
    data: {
      tenantId: TEST_TENANT_ID,
      firstName: 'Performance',
      lastName: 'Client',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      status: Status.ACTIVE,
    },
  });
  clientId = client.id;

  const exercise = await prisma.exercise.create({
    data: {
      tenantId: TEST_TENANT_ID,
      name: `Performance Exercise ${Date.now()}`,
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
});

describe('performances.service integration', () => {
  it('preserves history and orders it newest first', async () => {
    const performancesUseCases = createContainer().performances;
    // Feature: control-marcas-entrenamiento, Property 3: Creación de marca preserva el histórico
    await performancesUseCases.create.execute(TEST_TENANT_ID, clientId, exerciseId, trainerId, {
      value: 80,
      unit: PerformanceUnit.kg,
      date: '2026-06-01',
    });
    await performancesUseCases.create.execute(TEST_TENANT_ID, clientId, exerciseId, trainerId, {
      value: 90,
      unit: PerformanceUnit.kg,
      date: '2026-06-03',
    });
    await performancesUseCases.create.execute(TEST_TENANT_ID, clientId, exerciseId, trainerId, {
      value: 85,
      unit: PerformanceUnit.kg,
      date: '2026-06-02',
    });

    const history = await performancesUseCases.getHistory.execute(TEST_TENANT_ID, clientId, exerciseId);

    // Feature: control-marcas-entrenamiento, Property 4: Histórico ordenado de más reciente a más antiguo
    expect(history).toHaveLength(3);
    expect(history.map((record) => record.value)).toEqual(['90', '85', '80']);
  });

  it('rejects missing required value or unit without creating a record', async () => {
    const countBefore = await prisma.performanceRecord.count({
      where: { clientId, exerciseId },
    });

    // Feature: control-marcas-entrenamiento, Property 5: Marca rechazada sin campos obligatorios
    await expect(
      createContainer().performances.create.execute(TEST_TENANT_ID, clientId, exerciseId, trainerId, {
        value: '',
        unit: undefined as unknown as PerformanceUnit,
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      fields: ['value', 'unit'],
    });

    const countAfter = await prisma.performanceRecord.count({
      where: { clientId, exerciseId },
    });
    expect(countAfter).toBe(countBefore);
  });

  it('always stores the authenticated trainerId', async () => {
    // Feature: control-marcas-entrenamiento, Property 7: El trainerId coincide con el usuario autenticado
    const record = await createContainer().performances.create.execute(TEST_TENANT_ID, clientId, exerciseId, trainerId, {
      value: 100,
      unit: PerformanceUnit.kg,
      date: '2026-06-04',
    });

    expect(record.trainerId).toBe(trainerId);
  });

  it('excludes inactive exercises from listings and current marks', async () => {
    // Feature: control-marcas-entrenamiento, Property 8: Ejercicios INACTIVE excluidos de listados y Current_Mark
    const inactiveExercise = await prisma.exercise.create({
      data: {
        tenantId: TEST_TENANT_ID,
        name: `Inactive Performance Exercise ${Date.now()}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        measurementFields: JSON.stringify([
          { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
        ]),
        variantGroups: '[]',
        status: Status.INACTIVE,
      },
    });

    await prisma.performanceRecord.create({
      data: {
        tenantId: TEST_TENANT_ID,
        clientId,
        exerciseId: inactiveExercise.id,
        trainerId,
        value: '999',
        unit: PerformanceUnit.kg,
        date: new Date('2026-06-05T00:00:00.000Z'),
      },
    });

    const container = createContainer();
    const exercises = await container.exercises.list.execute(TEST_TENANT_ID);
    const currentMarks = await container.performances.getCurrentMarks.execute(TEST_TENANT_ID, clientId);

    expect(exercises.some((exercise) => exercise.id === inactiveExercise.id)).toBe(false);
    expect(currentMarks.some((mark) => mark.exerciseId === inactiveExercise.id)).toBe(false);
  });
});
