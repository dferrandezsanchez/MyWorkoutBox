import type { PerformanceRecordWithTrainerName } from '../../domain/shared/entities';
import { notFound } from '../../domain/shared/errors';
import type { ClientRepository, ExerciseRepository, PerformanceRepository } from '../../domain/repositories';

export class GetPerformanceHistoryUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly exercises: ExerciseRepository,
    private readonly performances: PerformanceRepository,
  ) {}

  async execute(
    tenantId: string,
    clientId: string,
    exerciseId: string,
  ): Promise<PerformanceRecordWithTrainerName[]> {
    const [client, exercise] = await Promise.all([
      this.clients.findById(tenantId, clientId),
      this.exercises.findById(tenantId, exerciseId),
    ]);
    if (!client || !exercise) throw notFound();
    return this.performances.findByClientAndExercise(tenantId, clientId, exerciseId);
  }
}
