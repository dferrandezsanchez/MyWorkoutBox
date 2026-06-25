import { Role } from '../../domain/shared/enums';
import { conflict } from '../../domain/shared/errors';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { PasswordHasher } from '../ports';
import type { CreateTrainerInput, TrainerUser } from './trainer-inputs';
import { normalizeEmail, normalizeName, toTrainerUser, validatePassword } from './trainer-inputs';

export class CreateTrainerUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(tenantId: string, data: CreateTrainerInput): Promise<TrainerUser> {
    const name = normalizeName(data.name);
    const email = normalizeEmail(data.email);
    const password = validatePassword(data.password);
    const active = data.active ?? true;

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      const existingMembership = await this.memberships.findByUserAndTenant(existingUser.id, tenantId);
      if (existingMembership) {
        throw conflict('Ya existe un entrenador con ese email en este centro');
      }
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = existingUser
      ? await this.users.update(existingUser.id, { name, active })
      : await this.users.createTrainer({ name, email, passwordHash, role: Role.TRAINER, active });

    const membership = await this.memberships.upsert({ userId: user.id, tenantId, role: Role.TRAINER, active });
    return toTrainerUser(user, membership);
  }
}
