import { beforeAll, describe, expect, it } from 'vitest';
import prisma from '../../infrastructure/prisma/prisma-client';
import { PerformanceUnit, Status } from '../../types/domain';
import { createContainer } from '../../main/container';
import { ensureTestTenant, TEST_TENANT_ID } from '../../test/tenant';

const measurementFields = JSON.stringify([
  { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
]);

beforeAll(async () => {
  await ensureTestTenant();
  await prisma.exercise.createMany({
    data: [
      {
        tenantId: TEST_TENANT_ID,
        name: `Activo Test ${Date.now()}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        measurementFields,
        variantGroups: '[]',
        status: Status.ACTIVE,
      },
      {
        tenantId: TEST_TENANT_ID,
        name: `Inactivo Test ${Date.now()}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        measurementFields,
        variantGroups: '[]',
        status: Status.INACTIVE,
      },
    ],
  });
});

describe('exercises.service listExercises', () => {
  it('returns only active exercises by default', async () => {
    const exercises = await createContainer().exercises.list.execute(TEST_TENANT_ID);

    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.every((exercise) => exercise.status === Status.ACTIVE)).toBe(true);
  });

  it('includes inactive exercises when requested', async () => {
    const exercises = await createContainer().exercises.list.execute(TEST_TENANT_ID, true);

    expect(exercises.some((exercise) => exercise.status === Status.INACTIVE)).toBe(true);
  });
});
