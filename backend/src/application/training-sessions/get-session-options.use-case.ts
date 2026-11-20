import type { ClientRepository, ClientRoutinePlanRepository, RoutineTemplateRepository } from '../../domain/repositories';
import { Status } from '../../domain/shared/enums';
import { notFound } from '../../domain/shared/errors';
import { nextPlanItem } from './routine-rules';
import type { SessionStartOptions } from './session-dtos';

/** What a trainer can start a session with for a client: next routine of the plan and active templates. */
export class GetSessionOptionsUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly templates: RoutineTemplateRepository,
    private readonly plans: ClientRoutinePlanRepository,
  ) {}

  async execute(tenantId: string, clientId: string): Promise<SessionStartOptions> {
    if (!await this.clients.findById(tenantId, clientId)) throw notFound();
    const [plan, templates] = await Promise.all([
      this.plans.findActiveByClient(tenantId, clientId),
      this.templates.list(tenantId, false),
    ]);
    const item = plan ? nextPlanItem(plan) : null;
    const nextRoutine = item?.template && item.template.status === Status.ACTIVE
      ? { position: item.position, template: item.template }
      : null;
    return { plan, nextRoutine, templates };
  }
}
