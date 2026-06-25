import type { Exercise } from '../../domain/shared/entities';
import { notFound } from '../../domain/shared/errors';
import type { ExerciseRepository } from '../../domain/repositories';

export class GetExerciseUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(tenantId: string, id: string): Promise<Exercise> {
    const exercise = await this.exercises.findById(tenantId, id);
    if (!exercise) throw notFound();
    return exercise;
  }
}
