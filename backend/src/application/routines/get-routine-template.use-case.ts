import type { RoutineTemplateRepository } from '../../domain/repositories';
import type { RoutineTemplate } from '../../domain/shared/entities';
import { findTemplateOrThrow } from './routine-rules';

export class GetRoutineTemplateUseCase {
  constructor(private readonly templates: RoutineTemplateRepository) {}

  execute(tenantId: string, id: string): Promise<RoutineTemplate> {
    return findTemplateOrThrow(this.templates, tenantId, id);
  }
}
