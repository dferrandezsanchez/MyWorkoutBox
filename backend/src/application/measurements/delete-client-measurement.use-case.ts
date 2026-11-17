import type { AuditLogRepository, ClientRepository, MeasurementRepository, TenantRepository } from '../../domain/repositories';
import { notFound } from '../../domain/shared/errors';
import { assertMeasurementAccess } from './measurement-access';

export class DeleteClientMeasurementUseCase {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly clients: ClientRepository,
    private readonly tenants: TenantRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(tenantId: string, clientId: string, measurementId: string, actorUserId: string): Promise<void> {
    await assertMeasurementAccess(this.tenants, this.clients, tenantId, clientId);
    const existing = await this.measurements.findById(tenantId, measurementId);
    if (!existing || existing.clientId !== clientId) throw notFound('Medición no encontrada');
    await this.measurements.delete(measurementId);
    await this.auditLogs.create({ tenantId, userId: actorUserId, action: 'DELETE', entityType: 'ClientMeasurement', entityId: measurementId });
  }
}
