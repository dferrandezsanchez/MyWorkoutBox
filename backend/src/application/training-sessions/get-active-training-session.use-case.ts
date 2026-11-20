import type { TrainingSessionRepository } from '../../domain/repositories';
import { loadSessionDetail } from './session-detail';

export class GetActiveTrainingSessionUseCase {
  constructor(private readonly sessions: TrainingSessionRepository) {}

  async execute(tenantId: string, trainerId: string) {
    const session = await this.sessions.findActiveByTrainer(tenantId, trainerId);
    return session ? loadSessionDetail(this.sessions, tenantId, session.id) : null;
  }
}
