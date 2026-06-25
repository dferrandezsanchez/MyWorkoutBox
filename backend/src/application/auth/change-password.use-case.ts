import { badRequest, notFound } from '../../domain/shared/errors';
import type { UserRepository } from '../../domain/repositories';
import type { PasswordHasher } from '../ports';
import type { ChangePasswordInput } from './auth-dtos';

export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(userId: string, data: ChangePasswordInput): Promise<void> {
    const currentPassword = data.currentPassword ?? '';
    const newPassword = data.newPassword ?? '';

    if (!currentPassword) throw badRequest('La contraseña actual es obligatoria');
    if (newPassword.length < 8) throw badRequest('La nueva contraseña debe tener al menos 8 caracteres');

    const user = await this.users.findById(userId);
    if (!user) throw notFound();

    const passwordMatch = await this.passwordHasher.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) throw badRequest('La contraseña actual no es correcta');

    await this.users.update(userId, { passwordHash: await this.passwordHasher.hash(newPassword) });
  }
}
