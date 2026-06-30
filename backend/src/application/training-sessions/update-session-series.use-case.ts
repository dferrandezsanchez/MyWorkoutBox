import type { AuditLogRepository, PerformanceRepository, TrainingSessionRepository } from '../../domain/repositories';
import { notFound } from '../../domain/shared/errors';
import type { Clock } from '../ports';
import type { SeriesInput } from './session-dtos';
import { normalizeSeriesInput, requireOwnedActiveSession } from './session-rules';

export class UpdateSessionSeriesUseCase {
  constructor(
    private readonly sessions: TrainingSessionRepository,
    private readonly performances: PerformanceRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string, userId: string, sessionId: string, recordId: string, data: SeriesInput) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    const record = await this.performances.findById(tenantId, recordId);
    if (!record?.sessionExerciseId || !session.exercises.some((item) => item.id === record.sessionExerciseId)) throw notFound();
    const updated = await this.performances.update(recordId, normalizeSeriesInput(data, this.clock));
    await this.auditLogs.create({ tenantId, userId, action: 'UPDATE', entityType: 'PerformanceRecord', entityId: recordId, metadata: JSON.stringify({ sessionId }) });
    return updated;
  }
}
