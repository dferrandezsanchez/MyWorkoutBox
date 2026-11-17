import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import type { Client } from '../../domain/shared/entities';
import { GetClientUseCase } from './get-client.use-case';
import { normalizeClientGoal, type ClientGoalInput } from './client-goal';

/** Trainers and admins keep the client's goal up to date from the profile. */
export class UpdateClientGoalUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(tenantId: string, clientId: string, input: ClientGoalInput, actorUserId: string): Promise<Client> {
    await this.getClient.execute(tenantId, clientId);
    const updated = await this.clients.update(tenantId, clientId, normalizeClientGoal(input));
    await this.auditLogs.create({ tenantId, userId: actorUserId, action: 'UPDATE_GOAL', entityType: 'Client', entityId: clientId });
    return updated;
  }
}
