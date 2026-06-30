import type { ExerciseRepository, TrainingSessionRepository } from '../../domain/repositories';
import { Status } from '../../domain/shared/enums';
import { badRequest, conflict, notFound } from '../../domain/shared/errors';
import { requireOwnedActiveSession } from './session-rules';

export class AddSessionExerciseUseCase {
  constructor(private readonly sessions: TrainingSessionRepository, private readonly exercises: ExerciseRepository) {}

  async execute(tenantId: string, userId: string, sessionId: string, exerciseId: string) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    const exercise = await this.exercises.findById(tenantId, exerciseId);
    if (!exercise) throw notFound();
    if (exercise.status !== Status.ACTIVE) throw badRequest('El ejercicio no está activo');
    if (session.exercises.some((item) => item.exerciseId === exerciseId)) throw conflict('El ejercicio ya está en la sesión');
    await this.sessions.addExercise(sessionId, exerciseId);
    return this.sessions.findDetail(tenantId, sessionId);
  }
}
