import type { LibraryExercise } from '../../domain/exercise-library';
import type { CreateExerciseData } from '../../domain/repositories';

/** Converts a library exercise to the shape stored for a center, remembering where it came from. */
export function libraryExerciseToData(exercise: LibraryExercise): CreateExerciseData {
  return {
    name: exercise.name,
    category: exercise.category,
    movementPattern: exercise.movementPattern,
    evaluationType: exercise.evaluationType,
    improvementDirection: exercise.improvementDirection,
    defaultUnit: exercise.defaultUnit,
    measurementFields: JSON.stringify(exercise.measurementFields),
    variantGroups: JSON.stringify(exercise.variantGroups),
    description: exercise.description || undefined,
    muscleGroup: exercise.muscleGroup,
    libraryKey: exercise.slug,
  };
}

/** Lowercase, no accents, single spaces: "Press  Banca" and "press banca" count as the same exercise. */
export function normalizeExerciseName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}
