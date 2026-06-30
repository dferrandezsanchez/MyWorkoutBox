import type { AuditLogRepository, TrainingSessionRepository } from '../../domain/repositories';
import { badRequest, notFound } from '../../domain/shared/errors';
import type { Clock } from '../ports';
import type { CompleteSessionInput } from './session-dtos';
import { requireOwnedActiveSession, seriesCount } from './session-rules';

export class CompleteTrainingSessionUseCase {
  constructor(private readonly sessions: TrainingSessionRepository, private readonly auditLogs: AuditLogRepository, private readonly clock: Clock) {}

  async execute(tenantId: string, userId: string, sessionId: string, data: CompleteSessionInput) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    if (seriesCount(session) === 0) throw badRequest('No puedes finalizar una sesión sin series');
    await this.sessions.complete(sessionId, this.clock.now(), data.notes);
    await this.auditLogs.create({ tenantId, userId, action: 'COMPLETE', entityType: 'TrainingSession', entityId: sessionId });
    return this.sessions.findDetail(tenantId, sessionId);
  }
}
