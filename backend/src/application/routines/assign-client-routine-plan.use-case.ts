import type { AuditLogRepository, ClientRepository, ClientRoutinePlanRepository, MembershipRepository, RoutineTemplateRepository } from '../../domain/repositories';
import type { ClientRoutinePlan } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { badRequest } from '../../domain/shared/errors';
import { normalizeClientRoutinePlanInput, type ClientRoutinePlanInputDto } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { assertPlanTemplatesAvailable, findClientOrThrow } from './routine-rules';

export class AssignClientRoutinePlanUseCase {
  constructor(
    private readonly plans: ClientRoutinePlanRepository,
    private readonly templates: RoutineTemplateRepository,
    private readonly clients: ClientRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  /** Replaces the client's active plan with a new ordered sequence of templates. */
  async execute(tenantId: string, actorUserId: string, clientId: string, input: ClientRoutinePlanInputDto): Promise<ClientRoutinePlan> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    const client = await findClientOrThrow(this.clients, tenantId, clientId);
    if (client.status !== Status.ACTIVE) throw badRequest('El cliente no está activo');
    const data = normalizeClientRoutinePlanInput(input);
    await assertPlanTemplatesAvailable(this.templates, tenantId, data.templateIds);
    const plan = await this.plans.replaceActive({ ...data, tenantId, clientId, createdById: actorUserId });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'ASSIGN',
      entityType: 'ClientRoutinePlan',
      entityId: plan.id,
      metadata: JSON.stringify({ clientId, templateIds: data.templateIds, nextPosition: data.nextPosition }),
    });
    return plan;
  }
}
