import type { RoutineTemplateRepository } from '../../domain/repositories';
import type { RoutineTemplate } from '../../domain/shared/entities';

export class ListRoutineTemplatesUseCase {
  constructor(private readonly templates: RoutineTemplateRepository) {}

  execute(tenantId: string, includeInactive = false): Promise<RoutineTemplate[]> {
    return this.templates.list(tenantId, includeInactive);
  }
}
