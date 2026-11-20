import type { AuditLogRepository, MembershipRepository, RoutineTemplateRepository } from '../../domain/repositories';
import type { RoutineTemplate } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { badRequest } from '../../domain/shared/errors';
import { requireRoutineManager } from './routine-permissions';
import { findTemplateOrThrow } from './routine-rules';

export class SetRoutineTemplateStatusUseCase {
  constructor(
    private readonly templates: RoutineTemplateRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(tenantId: string, actorUserId: string, id: string, status: unknown): Promise<RoutineTemplate> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    if (status !== Status.ACTIVE && status !== Status.INACTIVE) {
      throw badRequest('El estado no es válido', ['status']);
    }
    await findTemplateOrThrow(this.templates, tenantId, id);
    const template = await this.templates.update(tenantId, id, { status });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'RoutineTemplate',
      entityId: id,
      metadata: JSON.stringify({ field: 'status', value: status }),
    });
    return template;
  }
}
