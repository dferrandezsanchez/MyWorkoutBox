import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import type { CreateClientInput } from './client-inputs';
import { normalizeClientData } from './client-inputs';

export class CreateClientUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(tenantId: string, data: CreateClientInput, actorUserId: string): Promise<Client> {
    const client = await this.clients.create(tenantId, normalizeClientData(data));
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client.id,
    });
    return client;
  }
}
