import type { AuditLogRepository, ClientRepository, ClientRoutinePlanRepository, MembershipRepository } from '../../domain/repositories';
import { requireRoutineManager } from './routine-permissions';
import { findActivePlanOrThrow, findClientOrThrow } from './routine-rules';

export class RemoveClientRoutinePlanUseCase {
  constructor(
    private readonly plans: ClientRoutinePlanRepository,
    private readonly clients: ClientRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  /** Deactivates the client's active plan (history is kept). */
  async execute(tenantId: string, actorUserId: string, clientId: string): Promise<void> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    await findClientOrThrow(this.clients, tenantId, clientId);
    const plan = await findActivePlanOrThrow(this.plans, tenantId, clientId);
    await this.plans.deactivate(tenantId, plan.id);
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'REMOVE',
      entityType: 'ClientRoutinePlan',
      entityId: plan.id,
      metadata: JSON.stringify({ clientId }),
    });
  }
}
