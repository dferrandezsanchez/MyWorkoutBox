import type { AuditLogRepository, TrainingSessionRepository } from '../../domain/repositories';
import { conflict, notFound } from '../../domain/shared/errors';
import { requireOwnedActiveSession, seriesCount } from './session-rules';

export class DiscardTrainingSessionUseCase {
  constructor(private readonly sessions: TrainingSessionRepository, private readonly auditLogs: AuditLogRepository) {}

  async execute(tenantId: string, userId: string, sessionId: string) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    if (seriesCount(session) > 0) throw conflict('Solo puedes descartar una sesión vacía');
    await this.sessions.delete(sessionId);
    await this.auditLogs.create({ tenantId, userId, action: 'DISCARD', entityType: 'TrainingSession', entityId: sessionId });
  }
}
