import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import type { UpdateClientInput } from './client-inputs';
import { normalizeClientData } from './client-inputs';
import { GetClientUseCase } from './get-client.use-case';

export class UpdateClientUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(tenantId: string, id: string, data: UpdateClientInput, actorUserId: string): Promise<Client> {
    await this.getClient.execute(tenantId, id);
    const client = await this.clients.update(tenantId, id, normalizeClientData(data));
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ fields: Object.keys(data) }),
    });
    return client;
  }
}
