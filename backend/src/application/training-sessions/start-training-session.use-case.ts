import type {
  AuditLogRepository,
  ClientRepository,
  ClientRoutinePlanRepository,
  RoutineTemplateRepository,
  TrainingSessionRepository,
} from '../../domain/repositories';
import type { RoutineTemplate } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { badRequest, conflict, notFound } from '../../domain/shared/errors';
import type { Clock } from '../ports';
import { nextPlanItem } from './routine-rules';
import { loadSessionDetail } from './session-detail';
import type { StartSessionInput, StartSessionMode } from './session-dtos';

const MODES: StartSessionMode[] = ['free', 'plan', 'template'];

interface SessionOrigin {
  template: RoutineTemplate | null;
  routinePlanId?: string;
  routinePlanPosition?: number;
}

export class StartTrainingSessionUseCase {
  constructor(
    private readonly sessions: TrainingSessionRepository,
    private readonly clients: ClientRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
    private readonly templates: RoutineTemplateRepository,
    private readonly plans: ClientRoutinePlanRepository,
  ) {}

  async execute(tenantId: string, trainerId: string, input: StartSessionInput) {
    const mode = input?.mode ?? 'free';
    if (!MODES.includes(mode)) throw badRequest('El modo de inicio no es válido', ['mode']);

    const active = await this.sessions.findActiveByTrainer(tenantId, trainerId);
    if (active) throw conflict('Ya tienes una sesión activa');
    const clientId = input?.clientId;
    if (!clientId || typeof clientId !== 'string') throw badRequest('El cliente es obligatorio', ['clientId']);
    const client = await this.clients.findById(tenantId, clientId);
    if (!client) throw notFound();
    if (client.status !== Status.ACTIVE) throw badRequest('El cliente no está activo');

    const origin = await this.resolveOrigin(tenantId, clientId, mode, input.templateId);

    const session = await this.sessions.create({
      tenantId,
      clientId,
      trainerId,
      startedAt: this.clock.now(),
      ...(origin.template ? { routineTemplateId: origin.template.id } : {}),
      ...(origin.routinePlanId ? { routinePlanId: origin.routinePlanId, routinePlanPosition: origin.routinePlanPosition } : {}),
    });

    if (origin.template) {
      const exerciseIds = origin.template.exercises
        .filter((item) => !item.exercise || item.exercise.status === Status.ACTIVE)
        .map((item) => item.exerciseId);
      // Sequential on purpose: the repository assigns positions incrementally.
      for (const exerciseId of [...new Set(exerciseIds)]) {
        await this.sessions.addExercise(session.id, exerciseId);
      }
    }

    await this.auditLogs.create({
      tenantId,
      userId: trainerId,
      action: 'START',
      entityType: 'TrainingSession',
      entityId: session.id,
      metadata: JSON.stringify({
        mode,
        ...(origin.template ? { templateId: origin.template.id } : {}),
        ...(origin.routinePlanId ? { routinePlanId: origin.routinePlanId, routinePlanPosition: origin.routinePlanPosition } : {}),
      }),
    });
    return loadSessionDetail(this.sessions, tenantId, session.id);
  }

  private async resolveOrigin(tenantId: string, clientId: string, mode: StartSessionMode, templateId?: string): Promise<SessionOrigin> {
    if (mode === 'plan') {
      const plan = await this.plans.findActiveByClient(tenantId, clientId);
      const item = plan ? nextPlanItem(plan) : null;
      if (!plan || !item) throw badRequest('El cliente no tiene una serie de rutinas activa', ['mode']);
      const template = item.template ?? await this.templates.findById(tenantId, item.templateId);
      if (!template || template.status !== Status.ACTIVE) throw badRequest('La rutina que toca no está activa', ['mode']);
      return { template, routinePlanId: plan.id, routinePlanPosition: item.position };
    }
    if (mode === 'template') {
      if (!templateId || typeof templateId !== 'string') throw badRequest('La rutina es obligatoria', ['templateId']);
      const template = await this.templates.findById(tenantId, templateId);
      if (!template) throw notFound('Rutina no encontrada');
      if (template.status !== Status.ACTIVE) throw badRequest('La rutina no está activa', ['templateId']);
      return { template };
    }
    return { template: null };
  }
}
