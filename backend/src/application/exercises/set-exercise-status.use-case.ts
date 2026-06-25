import type { Exercise } from '../../domain/shared/entities';
import type { Status } from '../../domain/shared/enums';
import type { ExerciseRepository } from '../../domain/repositories';
import { GetExerciseUseCase } from './get-exercise.use-case';

export class SetExerciseStatusUseCase {
  private readonly getExercise: GetExerciseUseCase;

  constructor(private readonly exercises: ExerciseRepository) {
    this.getExercise = new GetExerciseUseCase(exercises);
  }

  async execute(tenantId: string, id: string, status: Status): Promise<Exercise> {
    await this.getExercise.execute(tenantId, id);
    return this.exercises.update(tenantId, id, { status });
  }
}
