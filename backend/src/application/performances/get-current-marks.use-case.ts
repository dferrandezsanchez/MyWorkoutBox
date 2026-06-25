import type { Exercise } from '../../domain/shared/entities';
import { notFound } from '../../domain/shared/errors';
import type { ClientRepository, ExerciseRepository, PerformanceRepository } from '../../domain/repositories';
import type { CurrentMarkResult } from './performance-dtos';

export class GetCurrentMarksUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly exercises: ExerciseRepository,
    private readonly performances: PerformanceRepository,
  ) {}

  async execute(tenantId: string, clientId: string): Promise<CurrentMarkResult[]> {
    const client = await this.clients.findById(tenantId, clientId);
    if (!client) throw notFound();

    const exercises = await this.exercises.list(tenantId, false);
    return Promise.all(
      exercises.map(async (exercise) => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exercise: toExerciseSummary(exercise),
        record: await this.performances.findLatestByClientExercise(tenantId, clientId, exercise.id),
      })),
    );
  }
}

function toExerciseSummary(exercise: Exercise): CurrentMarkResult['exercise'] {
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    movementPattern: exercise.movementPattern,
    evaluationType: exercise.evaluationType,
    improvementDirection: exercise.improvementDirection,
    defaultUnit: exercise.defaultUnit,
    measurementFields: exercise.measurementFields,
    variantGroups: exercise.variantGroups,
  };
}
