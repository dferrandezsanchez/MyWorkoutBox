import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import type { PhotoStorage } from '../ports';
import { GetClientUseCase } from './get-client.use-case';

export class DeleteClientPhotoUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly photoStorage: PhotoStorage,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(tenantId: string, id: string, actorUserId: string): Promise<Client> {
    const client = await this.getClient.execute(tenantId, id);
    if (client.photoUrl) {
      await this.photoStorage.deleteByUrl(client.photoUrl);
    }
    const updated = await this.clients.update(tenantId, id, { photoUrl: null, photoConsentAt: null });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ field: 'photo', action: 'delete' }),
    });
    return updated;
  }
}
