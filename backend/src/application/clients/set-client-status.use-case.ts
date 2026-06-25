import type { Client } from '../../domain/shared/entities';
import type { Status } from '../../domain/shared/enums';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import { GetClientUseCase } from './get-client.use-case';

export class SetClientStatusUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(tenantId: string, id: string, status: Status, actorUserId: string): Promise<Client> {
    await this.getClient.execute(tenantId, id);
    const client = await this.clients.update(tenantId, id, { status });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ field: 'status', value: status }),
    });
    return client;
  }
}
