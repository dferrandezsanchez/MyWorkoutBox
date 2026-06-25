import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { PasswordHasher } from '../ports';
import type { ResetTrainerPasswordInput } from './trainer-inputs';
import { validatePassword } from './trainer-inputs';
import { GetTrainerUseCase } from './get-trainer.use-case';

export class ResetTrainerPasswordUseCase {
  private readonly getTrainer: GetTrainerUseCase;

  constructor(
    private readonly users: UserRepository,
    memberships: MembershipRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    this.getTrainer = new GetTrainerUseCase(memberships);
  }

  async execute(tenantId: string, id: string, data: ResetTrainerPasswordInput): Promise<void> {
    await this.getTrainer.execute(tenantId, id);
    const passwordHash = await this.passwordHasher.hash(validatePassword(data.password));
    await this.users.update(id, { passwordHash });
  }
}
