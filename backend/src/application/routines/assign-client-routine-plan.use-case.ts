import type {
  AuditLogRepository,
  ClientRepository,
  ClientRoutinePlanRepository,
  MembershipRepository,
  RoutineProgramRepository,
  RoutineTemplateRepository,
} from '../../domain/repositories';
import type { ClientRoutinePlan } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { badRequest } from '../../domain/shared/errors';
import { parseClientRoutinePlanAssignment, parseNextPosition, type ClientRoutinePlanInputDto } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { assertPlanTemplatesAvailable, findClientOrThrow } from './routine-rules';

type PlanData = Omit<Parameters<ClientRoutinePlanRepository['replaceActive']>[0], 'tenantId' | 'clientId' | 'createdById'>;

export class AssignClientRoutinePlanUseCase {
  constructor(
    private readonly plans: ClientRoutinePlanRepository,
    private readonly templates: RoutineTemplateRepository,
    private readonly clients: ClientRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly programs: RoutineProgramRepository,
  ) {}

  /**
   * Replaces the client's active plan: either following a program live (`programId`) or with
   * its own ordered sequence of templates (`templateIds`).
   */
  async execute(tenantId: string, actorUserId: string, clientId: string, input: ClientRoutinePlanInputDto): Promise<ClientRoutinePlan> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    const client = await findClientOrThrow(this.clients, tenantId, clientId);
    if (client.status !== Status.ACTIVE) throw badRequest('El cliente no está activo');
    const assignment = parseClientRoutinePlanAssignment(input);

    let data: PlanData;
    if (assignment.kind === 'program') {
      const program = await this.programs.findById(tenantId, assignment.programId);
      if (!program) throw badRequest('El programa no existe en este centro', ['programId']);
      if (program.status !== Status.ACTIVE) throw badRequest(`El programa "${program.name}" está archivado`, ['programId']);
      data = { name: program.name, programId: program.id, nextPosition: parseNextPosition(assignment.nextPosition, program.items.length) };
    } else {
      await assertPlanTemplatesAvailable(this.templates, tenantId, assignment.templateIds);
      data = { name: assignment.name, templateIds: assignment.templateIds, nextPosition: assignment.nextPosition };
    }

    const plan = await this.plans.replaceActive({ ...data, tenantId, clientId, createdById: actorUserId });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'ASSIGN',
      entityType: 'ClientRoutinePlan',
      entityId: plan.id,
      metadata: JSON.stringify({
        clientId,
        programId: data.programId ?? null,
        templateIds: data.templateIds ?? null,
        nextPosition: data.nextPosition,
      }),
    });
    return plan;
  }
}
