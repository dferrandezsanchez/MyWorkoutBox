import { badRequest } from '../../domain/shared/errors';
import type { TenantRepository } from '../../domain/repositories';
import type { PublicTenant, UpdateTenantInput } from './auth-dtos';
import { GetCurrentTenantUseCase } from './get-current-tenant.use-case';

export const TENANT_NAME_MAX_LENGTH = 191;

/** Admins rename the center and switch optional features (measurement tracking). */
export class UpdateCurrentTenantUseCase {
  private readonly getCurrentTenant: GetCurrentTenantUseCase;

  constructor(private readonly tenants: TenantRepository) {
    this.getCurrentTenant = new GetCurrentTenantUseCase(tenants);
  }

  async execute(tenantId: string, data: UpdateTenantInput): Promise<PublicTenant> {
    const changes: { name?: string; measurementsEnabled?: boolean } = {};

    if (data.name !== undefined) {
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      if (!name) throw badRequest('El nombre del centro es obligatorio', ['name']);
      if (name.length > TENANT_NAME_MAX_LENGTH) {
        throw badRequest(`El nombre del centro no puede superar ${TENANT_NAME_MAX_LENGTH} caracteres`, ['name']);
      }
      changes.name = name;
    }

    if (data.measurementsEnabled !== undefined) {
      if (typeof data.measurementsEnabled !== 'boolean') {
        throw badRequest('El ajuste de mediciones debe ser verdadero o falso', ['measurementsEnabled']);
      }
      changes.measurementsEnabled = data.measurementsEnabled;
    }

    if (Object.keys(changes).length === 0) throw badRequest('No hay cambios que guardar', ['name']);

    await this.tenants.updateSettings(tenantId, changes);
    return this.getCurrentTenant.execute(tenantId);
  }
}
