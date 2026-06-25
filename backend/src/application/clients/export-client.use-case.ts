import type { Client, PerformanceRecord } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository, PerformanceRepository } from '../../domain/repositories';
import { GetClientUseCase } from './get-client.use-case';

export class ExportClientUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    clients: ClientRepository,
    private readonly performances: PerformanceRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(
    tenantId: string,
    id: string,
    actorUserId: string,
  ): Promise<{ client: Client; performances: PerformanceRecord[] }> {
    const client = await this.getClient.execute(tenantId, id);
    const performances = await this.performances.findByClient(tenantId, id);
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'EXPORT',
      entityType: 'Client',
      entityId: id,
    });
    return { client, performances };
  }
}
