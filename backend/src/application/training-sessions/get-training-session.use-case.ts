import type { TrainingSessionRepository } from '../../domain/repositories';
import { TrainingSessionStatus } from '../../domain/shared/enums';
import { forbidden, notFound } from '../../domain/shared/errors';

export class GetTrainingSessionUseCase {
  constructor(private readonly sessions: TrainingSessionRepository) {}

  async execute(tenantId: string, userId: string, id: string) {
    const session = await this.sessions.findDetail(tenantId, id);
    if (!session) throw notFound();
    if (session.status === TrainingSessionStatus.ACTIVE && session.trainerId !== userId) throw forbidden();
    return session;
  }
}
