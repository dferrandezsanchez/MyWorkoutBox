import type { MembershipRepository } from '../../domain/repositories';
import type { TrainerUser } from './trainer-inputs';
import { GetTrainerUseCase } from './get-trainer.use-case';

export class SetTrainerActiveUseCase {
  private readonly getTrainer: GetTrainerUseCase;

  constructor(private readonly memberships: MembershipRepository) {
    this.getTrainer = new GetTrainerUseCase(memberships);
  }

  async execute(tenantId: string, id: string, active: boolean): Promise<TrainerUser> {
    await this.getTrainer.execute(tenantId, id);
    await this.memberships.updateActive(id, tenantId, active);
    return this.getTrainer.execute(tenantId, id);
  }
}
