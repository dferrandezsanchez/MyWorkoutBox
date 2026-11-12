import { badRequest } from '../../domain/shared/errors';
import type { TenantRepository } from '../../domain/repositories';
import type { PublicTenant, UpdateTenantInput } from './auth-dtos';
import { GetCurrentTenantUseCase } from './get-current-tenant.use-case';

export const TENANT_NAME_MAX_LENGTH = 191;

export class UpdateCurrentTenantUseCase {
  private readonly getCurrentTenant: GetCurrentTenantUseCase;

  constructor(private readonly tenants: TenantRepository) {
    this.getCurrentTenant = new GetCurrentTenantUseCase(tenants);
  }

  async execute(tenantId: string, data: UpdateTenantInput): Promise<PublicTenant> {
    const name = typeof data.name === 'string' ? data.name.trim() : '';

    if (!name) throw badRequest('El nombre del centro es obligatorio', ['name']);
    if (name.length > TENANT_NAME_MAX_LENGTH) {
      throw badRequest(`El nombre del centro no puede superar ${TENANT_NAME_MAX_LENGTH} caracteres`, ['name']);
    }

    await this.tenants.updateName(tenantId, name);

    return this.getCurrentTenant.execute(tenantId);
  }
}
