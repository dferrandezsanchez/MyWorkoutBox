import type { ClientRepository, TenantRepository } from '../../domain/repositories';
import type { Client } from '../../domain/shared/entities';
import { forbidden, notFound } from '../../domain/shared/errors';

export const MEASUREMENTS_DISABLED_MESSAGE = 'El seguimiento de mediciones está desactivado en este centro';

/** Ensures the tenant has measurements enabled and the client belongs to it. */
export async function assertMeasurementAccess(
  tenants: TenantRepository,
  clients: ClientRepository,
  tenantId: string,
  clientId: string,
): Promise<Client> {
  const [tenant, client] = await Promise.all([tenants.findActiveById(tenantId), clients.findById(tenantId, clientId)]);
  if (!tenant?.measurementsEnabled) throw forbidden(MEASUREMENTS_DISABLED_MESSAGE);
  if (!client) throw notFound('Cliente no encontrado');
  return client;
}
