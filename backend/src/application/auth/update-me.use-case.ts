import { badRequest, conflict } from '../../domain/shared/errors';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { PublicUser, UpdateMeInput } from './auth-dtos';
import { GetMeUseCase } from './get-me.use-case';

export class UpdateMeUseCase {
  private readonly getMe: GetMeUseCase;

  constructor(
    private readonly users: UserRepository,
    memberships: MembershipRepository,
  ) {
    this.getMe = new GetMeUseCase(users, memberships);
  }

  async execute(userId: string, tenantId: string, organizationId: string, data: UpdateMeInput): Promise<PublicUser> {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();

    if (!name) throw badRequest('El nombre es obligatorio');
    if (!email) throw badRequest('El email es obligatorio');

    const existing = await this.users.findByEmail(email);
    if (existing && existing.id !== userId) throw conflict('Ya existe un usuario con ese email');

    await this.users.update(userId, { name, email });
    return this.getMe.execute(userId, tenantId, organizationId);
  }
}
