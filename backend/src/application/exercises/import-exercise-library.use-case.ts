import { findLibraryExercise } from '../../domain/exercise-library';
import type { ExerciseRepository } from '../../domain/repositories';
import { Status } from '../../domain/shared/enums';
import { badRequest } from '../../domain/shared/errors';
import { libraryExerciseToData, normalizeExerciseName } from './exercise-library-data';

export const MAX_LIBRARY_IMPORT = 100;

export interface ImportExerciseLibraryResult {
  created: number;
  reactivated: number;
  /** Already in the catalog and active: left untouched. */
  skipped: number;
}

/**
 * Adds library exercises to a center. Safe to repeat: what the center already has is
 * not duplicated, and one that was deactivated comes back instead of being created twice.
 */
export class ImportExerciseLibraryUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(tenantId: string, input: { slugs?: unknown }): Promise<ImportExerciseLibraryResult> {
    const slugs = this.parseSlugs(input.slugs);
    const wanted = slugs.map((slug) => {
      const exercise = findLibraryExercise(slug);
      if (!exercise) throw badRequest(`El ejercicio de la biblioteca no existe: ${slug}`, ['slugs']);
      return exercise;
    });

    const existing = await this.exercises.list(tenantId, true);
    const byKey = new Map(existing.filter((exercise) => exercise.libraryKey).map((exercise) => [exercise.libraryKey, exercise]));
    const byName = new Map(existing.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));

    const toCreate = [];
    let reactivated = 0;
    let skipped = 0;
    for (const exercise of wanted) {
      const current = byKey.get(exercise.slug) ?? byName.get(normalizeExerciseName(exercise.name));
      if (!current) {
        toCreate.push(libraryExerciseToData(exercise));
      } else if (current.status === Status.INACTIVE) {
        await this.exercises.update(tenantId, current.id, { status: Status.ACTIVE });
        reactivated += 1;
      } else {
        skipped += 1;
      }
    }

    const created = await this.exercises.createMany(tenantId, toCreate);
    return { created, reactivated, skipped };
  }

  private parseSlugs(raw: unknown): string[] {
    if (!Array.isArray(raw) || raw.length === 0 || raw.some((slug) => typeof slug !== 'string')) {
      throw badRequest('Indica al menos un ejercicio de la biblioteca', ['slugs']);
    }
    const unique = [...new Set(raw as string[])];
    if (unique.length > MAX_LIBRARY_IMPORT) {
      throw badRequest(`No se pueden añadir más de ${MAX_LIBRARY_IMPORT} ejercicios a la vez`, ['slugs']);
    }
    return unique;
  }
}
