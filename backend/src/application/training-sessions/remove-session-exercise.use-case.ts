import type { TrainingSessionRepository } from '../../domain/repositories';
import { conflict, notFound } from '../../domain/shared/errors';
import { requireOwnedActiveSession } from './session-rules';

export class RemoveSessionExerciseUseCase {
  constructor(private readonly sessions: TrainingSessionRepository) {}

  async execute(tenantId: string, userId: string, sessionId: string, sessionExerciseId: string) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    const item = session.exercises.find((entry) => entry.id === sessionExerciseId);
    if (!item) throw notFound();
    if (item.series.length > 0) throw conflict('No puedes quitar un ejercicio con series registradas');
    await this.sessions.removeExercise(sessionId, sessionExerciseId);
    return this.sessions.findDetail(tenantId, sessionId);
  }
}
