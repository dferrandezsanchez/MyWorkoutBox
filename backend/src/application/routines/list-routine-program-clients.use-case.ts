import type { ClientRepository, ClientRoutinePlanRepository, RoutineProgramRepository } from '../../domain/repositories';
import type { Client, ClientRoutinePlan } from '../../domain/shared/entities';
import type { RoutineProgramClientDto } from './routine-dtos';
import { findProgramOrThrow } from './routine-rules';

export class ListRoutineProgramClientsUseCase {
  constructor(
    private readonly programs: RoutineProgramRepository,
    private readonly plans: ClientRoutinePlanRepository,
    private readonly clients: ClientRepository,
  ) {}

  /** Clients whose active plan follows the program, with the routine each one has next. */
  async execute(tenantId: string, programId: string): Promise<RoutineProgramClientDto[]> {
    await findProgramOrThrow(this.programs, tenantId, programId);
    const plans = await this.plans.listActiveByProgram(tenantId, programId);
    const clients = await Promise.all(plans.map((plan) => this.clients.findById(tenantId, plan.clientId)));
    return plans
      .map((plan, index) => ({ plan, client: clients[index] }))
      .filter((entry): entry is { plan: ClientRoutinePlan; client: Client } => Boolean(entry.client))
      .map(({ plan, client }) => ({
        clientId: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        nextPosition: plan.nextPosition,
      }))
      .sort((left, right) => `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`));
  }
}
