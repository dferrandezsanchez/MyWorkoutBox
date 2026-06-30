import type { Client, PerformanceRecord, TrainingSessionDetail } from '../../domain/shared/entities';
import type {
  AuditLogRepository,
  ClientRepository,
  PerformanceRepository,
  TrainingSessionRepository,
} from '../../domain/repositories';
import { GetClientUseCase } from './get-client.use-case';

export class ExportClientUseCase {
  private readonly getClient: GetClientUseCase;

  constructor(
    clients: ClientRepository,
    private readonly performances: PerformanceRepository,
    private readonly trainingSessions: TrainingSessionRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {
    this.getClient = new GetClientUseCase(clients);
  }

  async execute(
    tenantId: string,
    id: string,
    actorUserId: string,
  ): Promise<{
    client: Client;
    performances: PerformanceRecord[];
    trainingSessions: TrainingSessionDetail[];
  }> {
    const client = await this.getClient.execute(tenantId, id);
    const [performances, trainingSessions] = await Promise.all([
      this.performances.findByClient(tenantId, id),
      this.trainingSessions.listByClient(tenantId, id),
    ]);
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'EXPORT',
      entityType: 'Client',
      entityId: id,
    });
    return { client, performances, trainingSessions };
  }
}
