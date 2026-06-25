import { notFound } from '../../domain/shared/errors';
import type { TenantRepository } from '../../domain/repositories';
import type { PublicTenant } from './auth-dtos';
import { toPublicTenant } from './auth-dtos';

export class GetCurrentTenantUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(tenantId: string): Promise<PublicTenant> {
    const tenant = await this.tenants.findActiveById(tenantId);
    if (!tenant) throw notFound();
    return toPublicTenant(tenant);
  }
}
