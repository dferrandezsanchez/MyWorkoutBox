import type { AuditLogRepository, ExerciseRepository, MembershipRepository, RoutineTemplateRepository } from '../../domain/repositories';
import type { RoutineTemplate } from '../../domain/shared/entities';
import { normalizeRoutineTemplateInput, type RoutineTemplateInputDto } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { assertTemplateExercisesAvailable } from './routine-rules';

export class CreateRoutineTemplateUseCase {
  constructor(
    private readonly templates: RoutineTemplateRepository,
    private readonly exercises: ExerciseRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(tenantId: string, actorUserId: string, input: RoutineTemplateInputDto): Promise<RoutineTemplate> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    const data = normalizeRoutineTemplateInput(input);
    await assertTemplateExercisesAvailable(this.exercises, tenantId, data);
    const template = await this.templates.create({ ...data, tenantId, createdById: actorUserId });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'RoutineTemplate',
      entityId: template.id,
      metadata: JSON.stringify({ exercises: template.exercises.length }),
    });
    return template;
  }
}
