import { conflict } from '../../domain/shared/errors';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { TrainerUser, UpdateTrainerInput } from './trainer-inputs';
import { normalizeEmail, normalizeName } from './trainer-inputs';
import { GetTrainerUseCase } from './get-trainer.use-case';

export class UpdateTrainerUseCase {
  private readonly getTrainer: GetTrainerUseCase;

  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
  ) {
    this.getTrainer = new GetTrainerUseCase(memberships);
  }

  async execute(tenantId: string, id: string, data: UpdateTrainerInput): Promise<TrainerUser> {
    await this.getTrainer.execute(tenantId, id);
    const updateData: { name?: string; email?: string; active?: boolean } = {};

    if (data.name !== undefined) updateData.name = normalizeName(data.name);
    if (data.email !== undefined) {
      updateData.email = normalizeEmail(data.email);
      await this.assertEmailAvailable(updateData.email, id);
    }
    if (data.active !== undefined) updateData.active = Boolean(data.active);

    await this.users.update(id, updateData);
    if (data.active !== undefined) await this.memberships.updateActive(id, tenantId, Boolean(data.active));
    return this.getTrainer.execute(tenantId, id);
  }

  private async assertEmailAvailable(email: string, currentUserId: string): Promise<void> {
    const existing = await this.users.findByEmail(email);
    if (existing && existing.id !== currentUserId) throw conflict('Ya existe un usuario con ese email');
  }
}
