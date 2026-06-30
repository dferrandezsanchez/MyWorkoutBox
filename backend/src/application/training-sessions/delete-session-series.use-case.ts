import type { AuditLogRepository, PerformanceRepository, TrainingSessionRepository } from '../../domain/repositories';
import { notFound } from '../../domain/shared/errors';
import { requireOwnedActiveSession } from './session-rules';

export class DeleteSessionSeriesUseCase {
  constructor(
    private readonly sessions: TrainingSessionRepository,
    private readonly performances: PerformanceRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(tenantId: string, userId: string, sessionId: string, recordId: string) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    const record = await this.performances.findById(tenantId, recordId);
    if (!record?.sessionExerciseId || !session.exercises.some((item) => item.id === record.sessionExerciseId)) throw notFound();
    await this.performances.delete(recordId);
    await this.performances.renumberSeries(record.sessionExerciseId);
    await this.auditLogs.create({ tenantId, userId, action: 'DELETE', entityType: 'PerformanceRecord', entityId: recordId, metadata: JSON.stringify({ sessionId }) });
  }
}
