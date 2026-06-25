import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import type { PhotoStorage, UploadedPhoto } from '../ports';
import { GetClientUseCase } from './get-client.use-case';

export class UploadClientPhotoUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly photoStorage: PhotoStorage,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(
    tenantId: string,
    id: string,
    file: UploadedPhoto,
    consentAt: Date,
    actorUserId: string,
  ): Promise<Client> {
    await this.getClient.execute(tenantId, id);
    const photoUrl = await this.photoStorage.persistClientPhoto(file);
    const client = await this.clients.update(tenantId, id, { photoUrl, photoConsentAt: consentAt });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: id,
      metadata: JSON.stringify({ field: 'photo' }),
    });
    return client;
  }
}
