import type {
  AuditLogRepository,
  ClientRoutinePlanRepository,
  MembershipRepository,
  RoutineProgramRepository,
  RoutineTemplateRepository,
} from '../../domain/repositories';
import type { RoutineProgram } from '../../domain/shared/entities';
import { normalizeRoutineProgramInput, type RoutineProgramInputDto } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { assertPlanTemplatesAvailable, findProgramOrThrow } from './routine-rules';

export class UpdateRoutineProgramUseCase {
  constructor(
    private readonly programs: RoutineProgramRepository,
    private readonly templates: RoutineTemplateRepository,
    private readonly plans: ClientRoutinePlanRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  /**
   * Full replace of name, notes and the ordered templates. Clients following the program see
   * the change live; those whose next routine falls beyond the new length restart at 1.
   */
  async execute(tenantId: string, actorUserId: string, id: string, input: RoutineProgramInputDto): Promise<RoutineProgram> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    await findProgramOrThrow(this.programs, tenantId, id);
    const data = normalizeRoutineProgramInput(input);
    await assertPlanTemplatesAvailable(this.templates, tenantId, data.templateIds);
    const program = await this.programs.update(tenantId, id, data);

    const following = await this.plans.listActiveByProgram(tenantId, id);
    const outOfRange = following.filter((plan) => plan.nextPosition > data.templateIds.length);
    await Promise.all(outOfRange.map((plan) => this.plans.setNextPosition(tenantId, plan.id, 1)));

    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'RoutineProgram',
      entityId: id,
      metadata: JSON.stringify({ templateIds: data.templateIds, resetPlanIds: outOfRange.map((plan) => plan.id) }),
    });
    return program;
  }
}
