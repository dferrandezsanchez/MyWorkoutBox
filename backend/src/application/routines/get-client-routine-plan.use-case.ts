import type { ClientRepository, ClientRoutinePlanRepository } from '../../domain/repositories';
import type { ClientRoutinePlan } from '../../domain/shared/entities';
import { findClientOrThrow } from './routine-rules';

export class GetClientRoutinePlanUseCase {
  constructor(private readonly plans: ClientRoutinePlanRepository, private readonly clients: ClientRepository) {}

  /** The client's active plan, or null when none is assigned. */
  async execute(tenantId: string, clientId: string): Promise<ClientRoutinePlan | null> {
    await findClientOrThrow(this.clients, tenantId, clientId);
    return this.plans.findActiveByClient(tenantId, clientId);
  }
}
