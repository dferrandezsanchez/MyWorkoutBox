import { describe, expect, it, vi } from 'vitest';
import { EXERCISE_LIBRARY, STARTER_EXERCISES } from '../../domain/exercise-library';
import type { CreateExerciseData, ExerciseRepository } from '../../domain/repositories';
import type { Exercise } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { CreateExerciseUseCase } from './create-exercise.use-case';
import { normalizeExerciseName } from './exercise-library-data';
import { ImportExerciseLibraryUseCase, MAX_LIBRARY_IMPORT } from './import-exercise-library.use-case';
import { ListExerciseLibraryUseCase } from './list-exercise-library.use-case';
import { UpdateExerciseUseCase } from './update-exercise.use-case';

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: 'e1', tenantId: 't1', name: 'Algo', category: 'strength', movementPattern: 'push', evaluationType: 'weight_reps',
    improvementDirection: 'higher', defaultUnit: 'kg', measurementFields: '[]', variantGroups: '[]', description: null,
    muscleGroup: null, libraryKey: null, status: Status.ACTIVE, createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

function repository(existing: Exercise[] = []) {
  const created: CreateExerciseData[][] = [];
  const repo: ExerciseRepository = {
    list: vi.fn(async () => existing),
    findById: vi.fn(async (_tenantId, id) => existing.find((item) => item.id === id) ?? null),
    create: vi.fn(async (_tenantId, data) => exercise({ ...data, id: 'new' } as Partial<Exercise>)),
    createMany: vi.fn(async (_tenantId, data) => {
      created.push(data);
      return data.length;
    }),
    update: vi.fn(async (_tenantId, id, data) => exercise({ id, ...data } as Partial<Exercise>)),
  };
  return { repo, created };
}

describe('normalizeExerciseName', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeExerciseName('  Jalón   al PECHO ')).toBe('jalon al pecho');
  });
});

describe('ListExerciseLibraryUseCase', () => {
  it('returns the groups and marks what the center already has, by key or by name', async () => {
    const { repo } = repository([
      exercise({ id: 'a', name: 'Cualquier cosa', libraryKey: 'curl_barra' }),
      exercise({ id: 'b', name: 'press BANCA con barra', status: Status.INACTIVE }),
    ]);

    const view = await new ListExerciseLibraryUseCase(repo).execute('t1');

    expect(view.groups.map((group) => group.key)).toEqual(
      ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'functional', 'cardio'],
    );
    expect(view.exercises).toHaveLength(EXERCISE_LIBRARY.length);
    expect(repo.list).toHaveBeenCalledWith('t1', true);
    const added = view.exercises.filter((item) => item.added).map((item) => item.slug);
    expect(added).toEqual(expect.arrayContaining(['curl_barra', 'press_banca_barra']));
    expect(added).toHaveLength(2);
    expect(view.exercises.find((item) => item.slug === 'dominadas')).toMatchObject({ muscleGroup: 'back', starter: true, added: false });
  });
});

describe('ImportExerciseLibraryUseCase', () => {
  it('creates the chosen exercises with their group and library key', async () => {
    const { repo, created } = repository();

    const result = await new ImportExerciseLibraryUseCase(repo).execute('t1', { slugs: ['remo_mancuerna', 'plancha_lateral', 'remo_mancuerna'] });

    expect(result).toEqual({ created: 2, reactivated: 0, skipped: 0 });
    expect(created[0].map((item) => [item.name, item.muscleGroup, item.libraryKey])).toEqual([
      ['Remo con mancuerna', 'back', 'remo_mancuerna'],
      ['Plancha lateral', 'core', 'plancha_lateral'],
    ]);
    expect(JSON.parse(created[0][0].measurementFields)).toHaveLength(2);
  });

  it('does not duplicate what exists, and brings back a deactivated exercise', async () => {
    const { repo, created } = repository([
      exercise({ id: 'a', name: 'Dominadas', libraryKey: 'dominadas' }),
      exercise({ id: 'b', name: 'Flexiones', status: Status.INACTIVE }),
    ]);

    const result = await new ImportExerciseLibraryUseCase(repo).execute('t1', { slugs: ['dominadas', 'flexiones', 'face_pull'] });

    expect(result).toEqual({ created: 1, reactivated: 1, skipped: 1 });
    expect(repo.update).toHaveBeenCalledWith('t1', 'b', { status: Status.ACTIVE });
    expect(created[0].map((item) => item.libraryKey)).toEqual(['face_pull']);
  });

  it('validates the request before writing anything', async () => {
    const { repo } = repository();
    const useCase = new ImportExerciseLibraryUseCase(repo);

    await expect(useCase.execute('t1', {})).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute('t1', { slugs: [] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute('t1', { slugs: [1] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(useCase.execute('t1', { slugs: ['no_existe'] })).rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('no_existe') });
    const tooMany = Array.from({ length: MAX_LIBRARY_IMPORT + 1 }, (_, index) => `x${index}`);
    await expect(useCase.execute('t1', { slugs: tooMany })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(repo.createMany).not.toHaveBeenCalled();
  });

  it('can import the whole library in one go', async () => {
    const { repo } = repository();
    const all = EXERCISE_LIBRARY.map((item) => item.slug);

    const result = await new ImportExerciseLibraryUseCase(repo).execute('t1', { slugs: all });

    expect(result.created).toBe(66);
    expect(STARTER_EXERCISES).toHaveLength(15);
  });
});

describe('exercise muscle group input', () => {
  it('accepts a known group, treats empty as none and rejects anything else', async () => {
    const { repo } = repository([exercise({ id: 'a' })]);
    const create = new CreateExerciseUseCase(repo);
    const update = new UpdateExerciseUseCase(repo);
    const base = { name: 'Mío', category: 'strength', defaultUnit: 'kg' as const };

    await create.execute('t1', { ...base, muscleGroup: 'chest' });
    await create.execute('t1', { ...base, muscleGroup: '' });
    await create.execute('t1', base);
    expect(vi.mocked(repo.create).mock.calls.map(([, data]) => data.muscleGroup)).toEqual(['chest', null, undefined]);

    await update.execute('t1', 'a', { muscleGroup: 'legs' });
    await update.execute('t1', 'a', { muscleGroup: null });
    await update.execute('t1', 'a', { name: 'Solo nombre' });
    expect(vi.mocked(repo.update).mock.calls.map(([, , data]) => data)).toEqual([{ muscleGroup: 'legs' }, { muscleGroup: null }, { name: 'Solo nombre' }]);

    await expect(create.execute('t1', { ...base, muscleGroup: 'brazos' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(update.execute('t1', 'a', { muscleGroup: 'brazos' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
