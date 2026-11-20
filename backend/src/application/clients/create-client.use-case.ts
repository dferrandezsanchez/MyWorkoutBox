import type { Client } from '../../domain/shared/entities';
import type { AuditLogRepository, ClientRepository, CreateClientData, MeasurementRepository, TenantRepository } from '../../domain/repositories';
import type { Clock } from '../ports';
import { hasMeasurementValues, normalizeMeasurement } from '../measurements/measurement-rules';
import type { CreateClientInput } from './client-inputs';
import { normalizeClientData } from './client-inputs';

export class CreateClientUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly measurements: MeasurementRepository,
    private readonly tenants: TenantRepository,
    private readonly clock: Clock,
  ) {}

  async execute(tenantId: string, data: CreateClientInput, actorUserId: string): Promise<Client> {
    // Validate the optional first measurement before creating anything.
    const tenant = hasMeasurementValues(data.initialMeasurement) ? await this.tenants.findActiveById(tenantId) : null;
    const initialMeasurement = tenant?.measurementsEnabled && hasMeasurementValues(data.initialMeasurement)
      ? normalizeMeasurement(data.initialMeasurement, this.clock.now())
      : null;

    // birthDate is required on CreateClientInput, so it is always present after normalization.
    const client = await this.clients.create(tenantId, normalizeClientData(data) as CreateClientData);
    await this.auditLogs.create({
      tenantId,
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client.id,
    });

    if (initialMeasurement) {
      const measurement = await this.measurements.create({ ...initialMeasurement, tenantId, clientId: client.id, createdById: actorUserId });
      await this.auditLogs.create({ tenantId, userId: actorUserId, action: 'CREATE', entityType: 'ClientMeasurement', entityId: measurement.id });
    }
    return client;
  }
}
