import type { RoutineProgramRepository } from '../../domain/repositories';
import type { RoutineProgram } from '../../domain/shared/entities';

export class ListRoutineProgramsUseCase {
  constructor(private readonly programs: RoutineProgramRepository) {}

  execute(tenantId: string, includeInactive = false): Promise<RoutineProgram[]> {
    return this.programs.list(tenantId, includeInactive);
  }
}
