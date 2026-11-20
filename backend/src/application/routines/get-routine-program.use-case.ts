import type { RoutineProgramRepository } from '../../domain/repositories';
import type { RoutineProgram } from '../../domain/shared/entities';
import { findProgramOrThrow } from './routine-rules';

export class GetRoutineProgramUseCase {
  constructor(private readonly programs: RoutineProgramRepository) {}

  execute(tenantId: string, id: string): Promise<RoutineProgram> {
    return findProgramOrThrow(this.programs, tenantId, id);
  }
}
