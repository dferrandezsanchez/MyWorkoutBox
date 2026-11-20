import type { AuditLogRepository, ExerciseRepository, MembershipRepository, RoutineTemplateRepository } from '../../domain/repositories';
import type { RoutineTemplate } from '../../domain/shared/entities';
import { normalizeRoutineTemplateInput, type RoutineTemplateInputDto } from './routine-dtos';
import { requireRoutineManager } from './routine-permissions';
import { assertTemplateExercisesAvailable, findTemplateOrThrow } from './routine-rules';

export class UpdateRoutineTemplateUseCase {
  constructor(
    private readonly templates: RoutineTemplateRepository,
    private readonly exercises: ExerciseRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  /** Full replace of name, notes and the ordered exercise list. */
  async execute(tenantId: string, actorUserId: string, id: string, input: RoutineTemplateInputDto): Promise<RoutineTemplate> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    await findTemplateOrThrow(this.templates, tenantId, id);
    const data = normalizeRoutineTemplateInput(input);
    await assertTemplateExercisesAvailable(this.exercises, tenantId, data);
    const template = await this.templates.update(tenantId, id, data);
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'RoutineTemplate',
      entityId: id,
      metadata: JSON.stringify({ exercises: template.exercises.length }),
    });
    return template;
  }
}
