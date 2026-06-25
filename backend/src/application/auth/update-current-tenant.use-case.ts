import { badRequest } from '../../domain/shared/errors';
import type { TenantRepository } from '../../domain/repositories';
import type { PublicTenant, UpdateTenantInput } from './auth-dtos';
import { DEFAULT_TENANT_BRAND, normalizeHexColor } from './auth-dtos';
import { GetCurrentTenantUseCase } from './get-current-tenant.use-case';

export class UpdateCurrentTenantUseCase {
  private readonly getCurrentTenant: GetCurrentTenantUseCase;

  constructor(private readonly tenants: TenantRepository) {
    this.getCurrentTenant = new GetCurrentTenantUseCase(tenants);
  }

  async execute(tenantId: string, data: UpdateTenantInput): Promise<PublicTenant> {
    const name = data.name?.trim();
    const shortName = data.shortName?.trim();
    const mark = data.mark?.trim();
    const claim = data.claim?.trim();
    const description = data.description?.trim();
    const primary = normalizeHexColor(data.primary, DEFAULT_TENANT_BRAND.primary);
    const primaryHover = normalizeHexColor(data.primaryHover, DEFAULT_TENANT_BRAND.primaryHover);
    const primarySoft = normalizeHexColor(data.primarySoft, DEFAULT_TENANT_BRAND.primarySoft);

    if (!name) throw badRequest('El nombre del centro es obligatorio', ['name']);
    if (!shortName) throw badRequest('El nombre corto es obligatorio', ['shortName']);
    if (!mark) throw badRequest('La marca es obligatoria', ['mark']);

    await this.tenants.updateBranding(tenantId, {
      name,
      appName: data.appName?.trim() || name,
      shortName,
      mark: mark.slice(0, 4),
      claim: claim || DEFAULT_TENANT_BRAND.claim,
      description: description || DEFAULT_TENANT_BRAND.description,
      primary,
      primaryHover,
      primarySoft,
    });

    return this.getCurrentTenant.execute(tenantId);
  }
}
