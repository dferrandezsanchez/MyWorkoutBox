import type { ClientRepository, MeasurementRepository, TenantRepository } from '../../domain/repositories';
import type { ClientMeasurement } from '../../domain/shared/entities';
import { assertMeasurementAccess } from './measurement-access';

export class ListClientMeasurementsUseCase {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly clients: ClientRepository,
    private readonly tenants: TenantRepository,
  ) {}

  async execute(tenantId: string, clientId: string): Promise<ClientMeasurement[]> {
    await assertMeasurementAccess(this.tenants, this.clients, tenantId, clientId);
    return this.measurements.listByClient(tenantId, clientId);
  }
}
