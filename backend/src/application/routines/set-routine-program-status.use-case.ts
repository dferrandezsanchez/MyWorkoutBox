import type { AuditLogRepository, MembershipRepository, RoutineProgramRepository } from '../../domain/repositories';
import type { RoutineProgram } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { badRequest } from '../../domain/shared/errors';
import { requireRoutineManager } from './routine-permissions';
import { findProgramOrThrow } from './routine-rules';

export class SetRoutineProgramStatusUseCase {
  constructor(
    private readonly programs: RoutineProgramRepository,
    private readonly memberships: MembershipRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  /**
   * Archives or restores a program. Archiving only prevents new assignments: clients already
   * following it keep their plan working.
   */
  async execute(tenantId: string, actorUserId: string, id: string, status: unknown): Promise<RoutineProgram> {
    await requireRoutineManager(this.memberships, tenantId, actorUserId);
    if (status !== Status.ACTIVE && status !== Status.INACTIVE) {
      throw badRequest('El estado no es válido', ['status']);
    }
    await findProgramOrThrow(this.programs, tenantId, id);
    const program = await this.programs.update(tenantId, id, { status });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'STATUS',
      entityType: 'RoutineProgram',
      entityId: id,
      metadata: JSON.stringify({ field: 'status', value: status }),
    });
    return program;
  }
}
