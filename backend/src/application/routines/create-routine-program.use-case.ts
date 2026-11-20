import type { AuditLogRepository, MembershipRepository, RoutineProgramRepository, RoutineTemplateRepository } from '../../domain/repositories';
import type { RoutineProgram } from '../../domain/shared/entities';
import { normalizeRoutineProgramInput, type RoutineProgramInputDto } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { assertPlanTemplatesAvailable } from './routine-rules';

export class CreateRoutineProgramUseCase {
  constructor(
    private readonly programs: RoutineProgramRepository,
    private readonly templates: RoutineTemplateRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(tenantId: string, actorUserId: string, input: RoutineProgramInputDto): Promise<RoutineProgram> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    const data = normalizeRoutineProgramInput(input);
    await assertPlanTemplatesAvailable(this.templates, tenantId, data.templateIds);
    const program = await this.programs.create({ ...data, tenantId, createdById: actorUserId });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'RoutineProgram',
      entityId: program.id,
      metadata: JSON.stringify({ templateIds: data.templateIds }),
    });
    return program;
  }
}
