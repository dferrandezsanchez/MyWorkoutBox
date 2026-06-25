import type { Client } from '../../domain/shared/entities';
import type { ClientRepository } from '../../domain/repositories';

export class ListClientsUseCase {
  constructor(private readonly clients: ClientRepository) {}

  execute(tenantId: string, query?: string, includeInactive = false): Promise<Client[]> {
    return this.clients.list(tenantId, { query, includeInactive });
  }
}
