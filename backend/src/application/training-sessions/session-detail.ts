import type { TrainingSessionRepository } from '../../domain/repositories';
import type { PerformanceRecordWithTrainerName, TrainingSessionDetail } from '../../domain/shared/entities';

export type TrainingSessionExerciseWithPrevious = TrainingSessionDetail['exercises'][number] & {
  /** Series from the client's last completed session with this exercise, used only to prefill the form. */
  previousSeries: PerformanceRecordWithTrainerName[];
};

export type TrainingSessionDetailWithPrevious = Omit<TrainingSessionDetail, 'exercises'> & {
  exercises: TrainingSessionExerciseWithPrevious[];
};

/**
 * Enriches every session exercise with `previousSeries`. Sessions hold a handful of
 * exercises, so lookups run in parallel instead of building a dedicated aggregate query.
 */
export async function withPreviousSeries(
  sessions: TrainingSessionRepository,
  session: TrainingSessionDetail,
): Promise<TrainingSessionDetailWithPrevious> {
  const exercises = await Promise.all(session.exercises.map(async (item) => ({
    ...item,
    previousSeries: await sessions.findPreviousSeries(session.tenantId, session.clientId, item.exerciseId, session.id),
  })));
  return { ...session, exercises };
}

/** Loads a session detail (if present) and enriches it with previous series. */
export async function loadSessionDetail(
  sessions: TrainingSessionRepository,
  tenantId: string,
  sessionId: string,
): Promise<TrainingSessionDetailWithPrevious | null> {
  const session = await sessions.findDetail(tenantId, sessionId);
  return session ? withPreviousSeries(sessions, session) : null;
}
