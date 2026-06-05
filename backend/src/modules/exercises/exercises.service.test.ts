import { beforeAll, describe, expect, it } from 'vitest';
import prisma from '../../prisma/client';
import { PerformanceUnit, Status } from '../../types/domain';
import { listExercises } from './exercises.service';

beforeAll(async () => {
  await prisma.exercise.createMany({
    data: [
      {
        name: `Activo Test ${Date.now()}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        status: Status.ACTIVE,
      },
      {
        name: `Inactivo Test ${Date.now()}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        status: Status.INACTIVE,
      },
    ],
  });
});

describe('exercises.service listExercises', () => {
  it('returns only active exercises by default', async () => {
    const exercises = await listExercises();

    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.every((exercise) => exercise.status === Status.ACTIVE)).toBe(true);
  });

  it('includes inactive exercises when requested', async () => {
    const exercises = await listExercises(true);

    expect(exercises.some((exercise) => exercise.status === Status.INACTIVE)).toBe(true);
  });
});
