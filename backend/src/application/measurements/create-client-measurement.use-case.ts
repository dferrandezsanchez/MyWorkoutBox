import type { Clock } from '../ports';
import type { AuditLogRepository, ClientRepository, MeasurementRepository, TenantRepository } from '../../domain/repositories';
import type { ClientMeasurement } from '../../domain/shared/entities';
import { assertMeasurementAccess } from './measurement-access';
import { normalizeMeasurement, type MeasurementInput } from './measurement-rules';

export class CreateClientMeasurementUseCase {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly clients: ClientRepository,
    private readonly tenants: TenantRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string, clientId: string, input: MeasurementInput, actorUserId: string): Promise<ClientMeasurement> {
    await assertMeasurementAccess(this.tenants, this.clients, tenantId, clientId);
    const values = normalizeMeasurement(input, this.clock.now());
    const measurement = await this.measurements.create({ ...values, tenantId, clientId, createdById: actorUserId });
    await this.auditLogs.create({ tenantId, userId: actorUserId, action: 'CREATE', entityType: 'ClientMeasurement', entityId: measurement.id });
    return measurement;
  }
}
