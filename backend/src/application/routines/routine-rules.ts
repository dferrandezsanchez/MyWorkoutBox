import type {
  ClientRepository,
  ClientRoutinePlanRepository,
  ExerciseRepository,
  RoutineTemplateRepository,
} from '../../domain/repositories';
import type { Client, ClientRoutinePlan, RoutineTemplate } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { badRequest, notFound } from '../../domain/shared/errors';
import type { NormalizedRoutineTemplateInput } from './routine-dtos';

export const ROUTINE_NOT_FOUND_MESSAGE = 'Rutina no encontrada';
export const CLIENT_NOT_FOUND_MESSAGE = 'Cliente no encontrado';
export const PLAN_NOT_FOUND_MESSAGE = 'El cliente no tiene una serie de rutinas activa';

export async function findTemplateOrThrow(
  templates: RoutineTemplateRepository,
  tenantId: string,
  id: string,
): Promise<RoutineTemplate> {
  const template = await templates.findById(tenantId, id);
  if (!template) throw notFound(ROUTINE_NOT_FOUND_MESSAGE);
  return template;
}

export async function findClientOrThrow(clients: ClientRepository, tenantId: string, id: string): Promise<Client> {
  const client = await clients.findById(tenantId, id);
  if (!client) throw notFound(CLIENT_NOT_FOUND_MESSAGE);
  return client;
}

export async function findActivePlanOrThrow(
  plans: ClientRoutinePlanRepository,
  tenantId: string,
  clientId: string,
): Promise<ClientRoutinePlan> {
  const plan = await plans.findActiveByClient(tenantId, clientId);
  if (!plan) throw notFound(PLAN_NOT_FOUND_MESSAGE);
  return plan;
}

/** Every exercise must belong to the tenant and be active. */
export async function assertTemplateExercisesAvailable(
  exercises: ExerciseRepository,
  tenantId: string,
  input: NormalizedRoutineTemplateInput,
): Promise<void> {
  const catalog = new Map((await exercises.list(tenantId, true)).map((exercise) => [exercise.id, exercise]));
  input.exercises.forEach((item, index) => {
    const exercise = catalog.get(item.exerciseId);
    if (!exercise) throw badRequest('Uno de los ejercicios no existe en este centro', [`exercises[${index}].exerciseId`]);
    if (exercise.status !== Status.ACTIVE) {
      throw badRequest(`El ejercicio "${exercise.name}" está archivado`, [`exercises[${index}].exerciseId`]);
    }
  });
}

/** Every template of a plan must belong to the tenant and be active. Repeats are allowed (A→B→A). */
export async function assertPlanTemplatesAvailable(
  templates: RoutineTemplateRepository,
  tenantId: string,
  templateIds: string[],
): Promise<void> {
  const unique = [...new Set(templateIds)];
  const found = await Promise.all(unique.map((id) => templates.findById(tenantId, id)));
  const byId = new Map(found.filter((item): item is RoutineTemplate => Boolean(item)).map((item) => [item.id, item]));
  templateIds.forEach((id, index) => {
    const template = byId.get(id);
    if (!template) throw badRequest('Una de las rutinas no existe en este centro', [`templateIds[${index}]`]);
    if (template.status !== Status.ACTIVE) {
      throw badRequest(`La rutina "${template.name}" está archivada`, [`templateIds[${index}]`]);
    }
  });
}
