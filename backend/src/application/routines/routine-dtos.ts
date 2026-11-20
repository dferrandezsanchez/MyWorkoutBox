import type { RoutineTemplateExerciseInput } from '../../domain/repositories';
import { badRequest } from '../../domain/shared/errors';

export const ROUTINE_NAME_MAX_LENGTH = 191;
export const ROUTINE_TARGET_REPS_MAX_LENGTH = 64;
export const ROUTINE_TARGET_SETS_MAX = 20;
export const ROUTINE_MAX_EXERCISES = 50;
export const ROUTINE_NOTES_MAX_LENGTH = 2000;
export const PLAN_MAX_TEMPLATES = 10;
export const DEFAULT_PLAN_NAME = 'Serie de rutinas';

export interface RoutineTemplateExerciseInputDto {
  exerciseId?: unknown;
  targetSets?: unknown;
  targetReps?: unknown;
  notes?: unknown;
}

/** Body of POST /routines and PUT /routines/:id (full replace). */
export interface RoutineTemplateInputDto {
  name?: unknown;
  notes?: unknown;
  exercises?: unknown;
}

/**
 * Body of PUT /clients/:id/routine-plan: either follow a program (`programId`) or
 * a custom sequence (`name` + `templateIds`). Never both.
 */
export interface ClientRoutinePlanInputDto {
  programId?: unknown;
  name?: unknown;
  templateIds?: unknown;
  nextPosition?: unknown;
}

/** Body of POST /routine-programs and PUT /routine-programs/:id (full replace). */
export interface RoutineProgramInputDto {
  name?: unknown;
  notes?: unknown;
  templateIds?: unknown;
}

export interface NormalizedRoutineProgramInput {
  name: string;
  notes: string | null;
  templateIds: string[];
}

/** Client following a program, as listed in GET /routine-programs/:id/clients. */
export interface RoutineProgramClientDto {
  clientId: string;
  firstName: string;
  lastName: string;
  nextPosition: number;
}

/** Parsed PUT /clients/:id/routine-plan body. Program positions are validated once the program is loaded. */
export type ClientRoutinePlanAssignment =
  | { kind: 'program'; programId: string; nextPosition: unknown }
  | ({ kind: 'custom' } & NormalizedClientRoutinePlanInput);

export interface NormalizedRoutineTemplateInput {
  name: string;
  notes: string | null;
  exercises: RoutineTemplateExerciseInput[];
}

export interface NormalizedClientRoutinePlanInput {
  name: string;
  templateIds: string[];
  nextPosition: number;
}

function optionalText(value: unknown, field: string, maxLength: number, label: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw badRequest(`${label} no es válido`, [field]);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) throw badRequest(`${label} no puede superar ${maxLength} caracteres`, [field]);
  return trimmed;
}

function parseTargetSets(value: unknown, index: number): number | null {
  if (value === undefined || value === null || value === '') return null;
  const sets = typeof value === 'string' ? Number(value) : value;
  if (typeof sets !== 'number' || !Number.isInteger(sets) || sets < 1 || sets > ROUTINE_TARGET_SETS_MAX) {
    throw badRequest(
      `Las series objetivo deben ser un número entero entre 1 y ${ROUTINE_TARGET_SETS_MAX}`,
      [`exercises[${index}].targetSets`],
    );
  }
  return sets;
}

function parseTargetReps(value: unknown, index: number): string | null {
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  return optionalText(text, `exercises[${index}].targetReps`, ROUTINE_TARGET_REPS_MAX_LENGTH, 'Las repeticiones objetivo');
}

export function normalizeRoutineTemplateInput(input: RoutineTemplateInputDto | null | undefined): NormalizedRoutineTemplateInput {
  const data = input ?? {};
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) throw badRequest('El nombre de la rutina es obligatorio', ['name']);
  if (name.length > ROUTINE_NAME_MAX_LENGTH) {
    throw badRequest(`El nombre no puede superar ${ROUTINE_NAME_MAX_LENGTH} caracteres`, ['name']);
  }
  const notes = optionalText(data.notes, 'notes', ROUTINE_NOTES_MAX_LENGTH, 'Las notas');

  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    throw badRequest('Añade al menos un ejercicio a la rutina', ['exercises']);
  }
  if (data.exercises.length > ROUTINE_MAX_EXERCISES) {
    throw badRequest(`Una rutina admite como máximo ${ROUTINE_MAX_EXERCISES} ejercicios`, ['exercises']);
  }

  const seen = new Set<string>();
  const exercises = (data.exercises as Array<RoutineTemplateExerciseInputDto | null>).map((item, index) => {
    const exerciseId = typeof item?.exerciseId === 'string' ? item.exerciseId.trim() : '';
    if (!item || !exerciseId) {
      throw badRequest('Cada ejercicio de la rutina necesita un ejercicio', [`exercises[${index}].exerciseId`]);
    }
    if (seen.has(exerciseId)) {
      throw badRequest('Un ejercicio no puede repetirse en la misma rutina', [`exercises[${index}].exerciseId`]);
    }
    seen.add(exerciseId);
    return {
      exerciseId,
      targetSets: parseTargetSets(item.targetSets, index),
      targetReps: parseTargetReps(item.targetReps, index),
      notes: optionalText(item.notes, `exercises[${index}].notes`, ROUTINE_NOTES_MAX_LENGTH, 'Las notas del ejercicio'),
    };
  });

  return { name, notes, exercises };
}

export function parseNextPosition(value: unknown, length: number): number {
  const position = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 1 || position > length) {
    throw badRequest(`La siguiente rutina debe estar entre 1 y ${length}`, ['nextPosition']);
  }
  return position;
}

/** Ordered template ids (1..PLAN_MAX_TEMPLATES, repeats allowed) of a plan ("serie") or program ("programa"). */
function parseTemplateIds(value: unknown, owner: 'serie' | 'programa'): string[] {
  const article = owner === 'serie' ? 'la' : 'el';
  const indefinite = owner === 'serie' ? 'Una' : 'Un';
  if (!Array.isArray(value) || value.length === 0) {
    throw badRequest(`Elige al menos una rutina para ${article} ${owner}`, ['templateIds']);
  }
  if (value.length > PLAN_MAX_TEMPLATES) {
    throw badRequest(`${indefinite} ${owner} admite como máximo ${PLAN_MAX_TEMPLATES} rutinas`, ['templateIds']);
  }
  return (value as unknown[]).map((id, index) => {
    if (typeof id !== 'string' || !id.trim()) throw badRequest('La rutina no es válida', [`templateIds[${index}]`]);
    return id.trim();
  });
}

export function normalizeRoutineProgramInput(input: RoutineProgramInputDto | null | undefined): NormalizedRoutineProgramInput {
  const data = input ?? {};
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) throw badRequest('El nombre del programa es obligatorio', ['name']);
  if (name.length > ROUTINE_NAME_MAX_LENGTH) {
    throw badRequest(`El nombre no puede superar ${ROUTINE_NAME_MAX_LENGTH} caracteres`, ['name']);
  }
  const notes = optionalText(data.notes, 'notes', ROUTINE_NOTES_MAX_LENGTH, 'Las notas');
  return { name, notes, templateIds: parseTemplateIds(data.templateIds, 'programa') };
}

/** Decides whether the client follows a program or gets a custom sequence; both at once is rejected. */
export function parseClientRoutinePlanAssignment(input: ClientRoutinePlanInputDto | null | undefined): ClientRoutinePlanAssignment {
  const data = input ?? {};
  if (data.programId === undefined || data.programId === null) {
    return { kind: 'custom', ...normalizeClientRoutinePlanInput(data) };
  }
  if (data.templateIds !== undefined && data.templateIds !== null) {
    throw badRequest('Elige un programa o una serie propia, no ambos', ['programId', 'templateIds']);
  }
  const programId = typeof data.programId === 'string' ? data.programId.trim() : '';
  if (!programId) throw badRequest('El programa no es válido', ['programId']);
  return { kind: 'program', programId, nextPosition: data.nextPosition ?? 1 };
}

export function normalizeClientRoutinePlanInput(
  input: ClientRoutinePlanInputDto | null | undefined,
): NormalizedClientRoutinePlanInput {
  const data = input ?? {};
  const name = (typeof data.name === 'string' ? data.name.trim() : '') || DEFAULT_PLAN_NAME;
  if (name.length > ROUTINE_NAME_MAX_LENGTH) {
    throw badRequest(`El nombre no puede superar ${ROUTINE_NAME_MAX_LENGTH} caracteres`, ['name']);
  }

  const templateIds = parseTemplateIds(data.templateIds, 'serie');
  const nextPosition = parseNextPosition(data.nextPosition ?? 1, templateIds.length);
  return { name, templateIds, nextPosition };
}
