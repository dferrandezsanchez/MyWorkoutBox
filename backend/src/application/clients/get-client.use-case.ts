import type { Client } from '../../domain/shared/entities';
import { notFound } from '../../domain/shared/errors';
import type { ClientRepository } from '../../domain/repositories';

export class GetClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(tenantId: string, id: string): Promise<Client> {
    const client = await this.clients.findById(tenantId, id);
    if (!client) throw notFound();
    return client;
  }
}
