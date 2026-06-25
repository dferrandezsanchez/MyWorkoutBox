import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import type { PhotoStorage } from '../ports';
import { GetClientUseCase } from './get-client.use-case';

export class AnonymizeClientUseCase {
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
    const updated = await this.clients.update(tenantId, id, {
      firstName: 'ANONIMIZADO',
      lastName: '',
      birthDate: new Date('1900-01-01T00:00:00.000Z'),
      photoUrl: null,
      notes: null,
      anonymizedAt: new Date(),
    });
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'ANONYMIZE',
      entityType: 'Client',
      entityId: id,
    });
    return updated;
  }
}
