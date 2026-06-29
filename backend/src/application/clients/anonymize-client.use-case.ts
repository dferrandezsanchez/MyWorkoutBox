import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository } from '../../domain/repositories';
import { GetClientUseCase } from './get-client.use-case';

export class AnonymizeClientUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(tenantId: string, id: string, actorUserId: string): Promise<Client> {
    await this.getClient.execute(tenantId, id);
    const updated = await this.clients.update(tenantId, id, {
      firstName: 'ANONIMIZADO',
      lastName: '',
      birthDate: new Date('1900-01-01T00:00:00.000Z'),
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
