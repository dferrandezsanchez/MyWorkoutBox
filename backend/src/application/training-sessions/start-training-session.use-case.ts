import type { AuditLogRepository, ClientRepository, TrainingSessionRepository } from '../../domain/repositories';
import { Status } from '../../domain/shared/enums';
import { badRequest, conflict, notFound } from '../../domain/shared/errors';
import type { Clock } from '../ports';

export class StartTrainingSessionUseCase {
  constructor(
    private readonly sessions: TrainingSessionRepository,
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string, trainerId: string, clientId: string) {
    const active = await this.sessions.findActiveByTrainer(tenantId, trainerId);
    if (active) throw conflict('Ya tienes una sesión activa');
    const client = await this.clients.findById(tenantId, clientId);
    if (!client) throw notFound();
    if (client.status !== Status.ACTIVE) throw badRequest('El cliente no está activo');

    const session = await this.sessions.create({ tenantId, clientId, trainerId, startedAt: this.clock.now() });
    await this.auditLogs.create({ tenantId, userId: trainerId, action: 'START', entityType: 'TrainingSession', entityId: session.id });
    return this.sessions.findDetail(tenantId, session.id);
  }
}
