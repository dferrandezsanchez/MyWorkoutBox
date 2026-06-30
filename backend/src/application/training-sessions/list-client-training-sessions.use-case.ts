import type { ClientRepository, TrainingSessionRepository } from '../../domain/repositories';
import { notFound } from '../../domain/shared/errors';

export class ListClientTrainingSessionsUseCase {
  constructor(private readonly sessions: TrainingSessionRepository, private readonly clients: ClientRepository) {}

  async execute(tenantId: string, clientId: string) {
    if (!await this.clients.findById(tenantId, clientId)) throw notFound();
    return this.sessions.listByClient(tenantId, clientId);
  }
}
