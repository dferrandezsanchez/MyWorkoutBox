import type { AuditLogRepository, ClientRoutinePlanRepository, TrainingSessionRepository } from '../../domain/repositories';
import type { TrainingSession } from '../../domain/shared/entities';
import { badRequest, notFound } from '../../domain/shared/errors';
import type { Clock } from '../ports';
import { followingPlanPosition } from './routine-rules';
import { loadSessionDetail } from './session-detail';
import type { CompleteSessionInput } from './session-dtos';
import { requireOwnedActiveSession, seriesCount } from './session-rules';

export class CompleteTrainingSessionUseCase {
  constructor(
    private readonly sessions: TrainingSessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
    private readonly plans: ClientRoutinePlanRepository,
  ) {}

  async execute(tenantId: string, userId: string, sessionId: string, data: CompleteSessionInput) {
    const session = await this.sessions.findDetail(tenantId, sessionId);
    if (!session) throw notFound();
    requireOwnedActiveSession(session, userId);
    if (seriesCount(session) === 0) throw badRequest('No puedes finalizar una sesión sin series');
    await this.sessions.complete(sessionId, this.clock.now(), data?.notes);
    await this.advancePlan(tenantId, session);
    await this.auditLogs.create({ tenantId, userId, action: 'COMPLETE', entityType: 'TrainingSession', entityId: sessionId });
    return loadSessionDetail(this.sessions, tenantId, sessionId);
  }

  /**
   * Moves the client's plan to the following routine (A -> B -> C -> A) when the session
   * covered the position the plan was waiting for. If the plan was changed, deactivated or
   * already advanced meanwhile, it is left untouched.
   */
  private async advancePlan(tenantId: string, session: TrainingSession): Promise<void> {
    if (!session.routinePlanId || !session.routinePlanPosition) return;
    const plan = await this.plans.findById(tenantId, session.routinePlanId);
    if (!plan?.active || plan.items.length === 0) return;
    if (plan.nextPosition !== session.routinePlanPosition) return;
    await this.plans.setNextPosition(tenantId, plan.id, followingPlanPosition(session.routinePlanPosition, plan.items.length));
  }
}
