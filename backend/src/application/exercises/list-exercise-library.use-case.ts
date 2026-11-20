import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type LibraryExercise } from '../../domain/exercise-library';
import type { ExerciseRepository } from '../../domain/repositories';
import { normalizeExerciseName } from './exercise-library-data';

export interface ExerciseLibraryItem {
  slug: string;
  name: string;
  muscleGroup: string;
  category: string;
  evaluationType: string;
  defaultUnit: string;
  starter: boolean;
  /** The center already has it, imported from the library or created by hand with the same name. */
  added: boolean;
}

export interface ExerciseLibraryView {
  groups: Array<{ key: string; label: string }>;
  exercises: ExerciseLibraryItem[];
}

export function toLibraryItem(exercise: LibraryExercise, added: boolean): ExerciseLibraryItem {
  return {
    slug: exercise.slug,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    category: exercise.category,
    evaluationType: exercise.evaluationType,
    defaultUnit: exercise.defaultUnit,
    starter: exercise.starter,
    added,
  };
}

/** The exercise library, marking which entries the center already has. */
export class ListExerciseLibraryUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(tenantId: string): Promise<ExerciseLibraryView> {
    const existing = await this.exercises.list(tenantId, true);
    const keys = new Set(existing.map((exercise) => exercise.libraryKey).filter(Boolean));
    const names = new Set(existing.map((exercise) => normalizeExerciseName(exercise.name)));

    return {
      groups: MUSCLE_GROUPS.map(({ key, label }) => ({ key, label })),
      exercises: EXERCISE_LIBRARY.map((exercise) =>
        toLibraryItem(exercise, keys.has(exercise.slug) || names.has(normalizeExerciseName(exercise.name))),
      ),
    };
  }
}
