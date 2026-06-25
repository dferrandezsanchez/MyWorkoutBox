import type { Exercise } from '../../domain/shared/entities';
import type { ExerciseRepository } from '../../domain/repositories';
import type { UpdateExerciseInput } from './exercise-inputs';
import { normalizeUpdateExerciseData } from './exercise-inputs';
import { GetExerciseUseCase } from './get-exercise.use-case';

export class UpdateExerciseUseCase {
  private readonly getExercise: GetExerciseUseCase;

  constructor(private readonly exercises: ExerciseRepository) {
    this.getExercise = new GetExerciseUseCase(exercises);
  }

  async execute(tenantId: string, id: string, data: UpdateExerciseInput): Promise<Exercise> {
    await this.getExercise.execute(tenantId, id);
    return this.exercises.update(tenantId, id, normalizeUpdateExerciseData(data));
  }
}
