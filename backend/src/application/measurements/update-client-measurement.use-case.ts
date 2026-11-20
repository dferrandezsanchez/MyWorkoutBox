import type { Clock } from '../ports';
import type { AuditLogRepository, ClientRepository, MeasurementRepository, TenantRepository } from '../../domain/repositories';
import type { ClientMeasurement } from '../../domain/shared/entities';
import { notFound } from '../../domain/shared/errors';
import { assertMeasurementAccess } from './measurement-access';
import { normalizeMeasurement, type MeasurementInput } from './measurement-rules';

export class UpdateClientMeasurementUseCase {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly clients: ClientRepository,
    private readonly tenants: TenantRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string, clientId: string, measurementId: string, input: MeasurementInput, actorUserId: string): Promise<ClientMeasurement> {
    await assertMeasurementAccess(this.tenants, this.clients, tenantId, clientId);
    const existing = await this.measurements.findById(tenantId, measurementId);
    if (!existing || existing.clientId !== clientId) throw notFound('Medición no encontrada');
    const updated = await this.measurements.update(measurementId, normalizeMeasurement(input, this.clock.now()));
    await this.auditLogs.create({ tenantId, userId: actorUserId, action: 'UPDATE', entityType: 'ClientMeasurement', entityId: measurementId });
    return updated;
  }
}
