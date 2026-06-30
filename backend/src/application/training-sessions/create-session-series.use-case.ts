import type { AuditLogRepository, PerformanceRepository, TrainingSessionRepository } from '../../domain/repositories';
import { notFound } from '../../domain/shared/errors';
import type { Clock } from '../ports';
import type { SeriesInput } from './session-dtos';
import { normalizeSeriesInput, requireOwnedActiveSession } from './session-rules';

export class CreateSessionSeriesUseCase {
  constructor(
    private readonly sessions: TrainingSessionRepository,
    private readonly performances: PerformanceRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string, userId: string, sessionId: string, sessionExerciseId: string, data: SeriesInput) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    const item = session.exercises.find((entry) => entry.id === sessionExerciseId);
    if (!item) throw notFound();
    const normalized = normalizeSeriesInput(data, this.clock);
    const record = await this.performances.create({
      tenantId,
      clientId: session.clientId,
      exerciseId: item.exerciseId,
      trainerId: userId,
      ...normalized,
      sessionExerciseId,
      seriesNumber: item.series.length + 1,
    });
    await this.auditLogs.create({ tenantId, userId, action: 'CREATE', entityType: 'PerformanceRecord', entityId: record.id, metadata: JSON.stringify({ sessionId, seriesNumber: record.seriesNumber }) });
    return record;
  }
}
