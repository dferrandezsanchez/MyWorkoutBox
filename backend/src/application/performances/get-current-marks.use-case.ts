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
    const records = await this.performances.findByClientWithTrainer(tenantId, clientId);
    return exercises.map((exercise) => {
      const exerciseRecords = records.filter((record) => record.exerciseId === exercise.id);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exercise: toExerciseSummary(exercise),
        record: exerciseRecords[0] ?? null,
        bestRecord: findBestRecord(exerciseRecords, exercise.improvementDirection),
        recentRecords: exerciseRecords.slice(0, 6).reverse(),
      };
    });
  }
}

function findBestRecord<T extends { value: string }>(records: T[], direction: string): T | null {
  if (records.length === 0) return null;
  if (direction === 'qualitative') return records[0];
  return records.reduce((best, record) => {
    const currentValue = Number(record.value);
    const bestValue = Number(best.value);
    if (!Number.isFinite(currentValue)) return best;
    if (!Number.isFinite(bestValue)) return record;
    const isImprovement = direction === 'lower'
      ? currentValue < bestValue
      : currentValue > bestValue;
    return isImprovement ? record : best;
  });
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
