import type { TrainingSessionRepository } from '../../domain/repositories';

export class GetActiveTrainingSessionUseCase {
  constructor(private readonly sessions: TrainingSessionRepository) {}

  async execute(tenantId: string, trainerId: string) {
    const session = await this.sessions.findActiveByTrainer(tenantId, trainerId);
    return session ? this.sessions.findDetail(tenantId, session.id) : null;
  }
}
