import type { Exercise } from '../../domain/shared/entities';
import type { ExerciseRepository } from '../../domain/repositories';

export class ListExercisesUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  execute(tenantId: string, includeInactive = false): Promise<Exercise[]> {
    return this.exercises.list(tenantId, includeInactive);
  }
}
