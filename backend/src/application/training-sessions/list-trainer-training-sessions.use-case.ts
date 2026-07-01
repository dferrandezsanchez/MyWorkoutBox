import type { TrainingSessionRepository } from '../../domain/repositories';

export class ListTrainerTrainingSessionsUseCase {
  constructor(private readonly sessions: TrainingSessionRepository) {}

  execute(tenantId: string, trainerId: string, limit = 10) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 50);
    return this.sessions.listByTrainer(tenantId, trainerId, safeLimit);
  }
}
