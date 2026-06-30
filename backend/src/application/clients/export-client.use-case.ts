import type {
  AuditLogRepository,
  ClientRepository,
  PerformanceRepository,
  TrainingSessionRepository,
} from '../../domain/repositories';
import type { ClientExportData } from './client-export.dto';
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
  ): Promise<ClientExportData> {
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
