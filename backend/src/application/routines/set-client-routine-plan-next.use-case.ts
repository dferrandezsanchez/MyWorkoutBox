import type { AuditLogRepository, ClientRepository, ClientRoutinePlanRepository, MembershipRepository } from '../../domain/repositories';
import type { ClientRoutinePlan } from '../../domain/shared/entities';
import { parseNextPosition } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { findActivePlanOrThrow, findClientOrThrow } from './routine-rules';

export class SetClientRoutinePlanNextUseCase {
  constructor(
    private readonly plans: ClientRoutinePlanRepository,
    private readonly clients: ClientRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  /** Lets a manager choose which routine of the plan comes next. */
  async execute(tenantId: string, actorUserId: string, clientId: string, nextPosition: unknown): Promise<ClientRoutinePlan> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    await findClientOrThrow(this.clients, tenantId, clientId);
    const plan = await findActivePlanOrThrow(this.plans, tenantId, clientId);
    const position = parseNextPosition(nextPosition, plan.items.length);
    await this.plans.setNextPosition(tenantId, plan.id, position);
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'ClientRoutinePlan',
      entityId: plan.id,
      metadata: JSON.stringify({ field: 'nextPosition', value: position }),
    });
    return { ...plan, nextPosition: position };
  }
}
