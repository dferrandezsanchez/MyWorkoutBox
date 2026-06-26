import { describe, expect, it, vi } from 'vitest';
import {
  GetExerciseUseCase,
  ListExercisesUseCase,
  SetExerciseStatusUseCase,
  UpdateExerciseUseCase,
} from './index';
import { Status } from '../../domain/shared/enums';
import { notFound } from '../../domain/shared/errors';
import type { ExerciseRepository } from '../../domain/repositories';
import type { Exercise } from '../../domain/shared/entities';

const exercise: Exercise = {
  id: 'exercise-1',
  tenantId: 'tenant-1',
  name: 'Sentadilla',
  category: 'strength',
  movementPattern: 'squat',
  evaluationType: 'weight_reps',
  improvementDirection: 'higher',
  defaultUnit: 'kg',
  measurementFields: '[]',
  variantGroups: '[]',
  description: null,
  status: Status.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createRepository(overrides: Partial<ExerciseRepository> = {}): ExerciseRepository {
  return {
    list: vi.fn(async () => [exercise]),
    findById: vi.fn(async (_tenantId, id) => (id === exercise.id ? exercise : null)),
    create: vi.fn(),
    update: vi.fn(async (_tenantId, _id, data) => ({ ...exercise, ...data })),
    ...overrides,
  };
}

describe('exercise use cases', () => {
  it('lists, gets, updates and changes status', async () => {
    const repository = createRepository();

    await expect(new ListExercisesUseCase(repository).execute('tenant-1', true)).resolves.toEqual([exercise]);
    await expect(new GetExerciseUseCase(repository).execute('tenant-1', exercise.id)).resolves.toEqual(exercise);
    await expect(new UpdateExerciseUseCase(repository).execute('tenant-1', exercise.id, { name: 'Peso muerto' })).resolves.toMatchObject({
      name: 'Peso muerto',
    });
    await expect(new SetExerciseStatusUseCase(repository).execute('tenant-1', exercise.id, Status.INACTIVE)).resolves.toMatchObject({
      status: Status.INACTIVE,
    });
  });

  it('throws not found when exercise does not exist', async () => {
    const repository = createRepository({ findById: vi.fn(async () => null) });

    await expect(new GetExerciseUseCase(repository).execute('tenant-1', 'missing')).rejects.toMatchObject(notFound());
  });
});
