import type { Exercise } from '../../domain/shared/entities';
import type { ExerciseRepository } from '../../domain/repositories';
import type { CreateExerciseInput } from './exercise-inputs';
import { normalizeCreateExerciseData } from './exercise-inputs';

export class CreateExerciseUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  execute(tenantId: string, data: CreateExerciseInput): Promise<Exercise> {
    return this.exercises.create(tenantId, normalizeCreateExerciseData(data));
  }
}
