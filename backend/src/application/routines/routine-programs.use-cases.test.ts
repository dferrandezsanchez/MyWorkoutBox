import { describe, expect, it, vi } from 'vitest';
import type {
  AuditLogRepository,
  ClientRepository,
  ClientRoutinePlanRepository,
  MembershipRepository,
  RoutineProgramRepository,
  RoutineTemplateRepository,
} from '../../domain/repositories';
import type { Client, ClientRoutinePlan, Membership, RoutineProgram, RoutineTemplate } from '../../domain/shared/entities';
import { Role, Status } from '../../domain/shared/enums';
import {
  AssignClientRoutinePlanUseCase,
  CreateRoutineProgramUseCase,
  GetRoutineProgramUseCase,
  ListRoutineProgramClientsUseCase,
  ListRoutineProgramsUseCase,
  SetClientRoutinePlanNextUseCase,
  SetRoutineProgramStatusUseCase,
  UpdateRoutineProgramUseCase,
  normalizeRoutineProgramInput,
  parseClientRoutinePlanAssignment,
} from './index';

const NOW = new Date('2026-11-20T10:00:00.000Z');
const TENANT = 'tenant-1';

function template(id: string, status = Status.ACTIVE): RoutineTemplate {
  return { id, tenantId: TENANT, name: `Rutina ${id}`, notes: null, status, createdById: 'admin-1', createdAt: NOW, updatedAt: NOW, exercises: [] };
}

function program(id: string, templateIds: string[], status = Status.ACTIVE): RoutineProgram {
  return {
    id,
    tenantId: TENANT,
    name: `Programa ${id}`,
    notes: null,
    status,
    createdById: 'admin-1',
    createdAt: NOW,
    updatedAt: NOW,
    items: templateIds.map((templateId, index) => ({ id: `${id}-i${index}`, programId: id, templateId, position: index + 1 })),
    activeClientCount: 0,
  };
}

function membership(role: Role, canManageRoutines = false): Membership {
  return { id: 'm-1', userId: 'user-1', tenantId: TENANT, role, canManageRoutines, active: true, createdAt: NOW, updatedAt: NOW };
}

function client(id: string, firstName: string, status = Status.ACTIVE): Client {
  return { id, tenantId: TENANT, firstName, lastName: 'Demo', status } as Client;
}

function followingPlan(id: string, clientId: string, nextPosition: number, programId = 'prog-1'): ClientRoutinePlan {
  const source = program(programId, ['tpl-a', 'tpl-b', 'tpl-c']);
  return {
    id,
    tenantId: TENANT,
    clientId,
    name: source.name,
    active: true,
    nextPosition,
    programId,
    program: { id: programId, name: source.name, status: Status.ACTIVE },
    createdById: 'admin-1',
    createdAt: NOW,
    updatedAt: NOW,
    items: source.items.map((item) => ({ id: item.id, planId: id, templateId: item.templateId, position: item.position })),
  };
}

function setup({
  member = membership(Role.ADMIN) as Membership | null,
  programsById = {
    'prog-1': program('prog-1', ['tpl-a', 'tpl-b', 'tpl-c']),
    'prog-old': program('prog-old', ['tpl-a'], Status.INACTIVE),
  } as Record<string, RoutineProgram>,
  following = [followingPlan('plan-1', 'client-1', 3), followingPlan('plan-2', 'client-2', 1)] as ClientRoutinePlan[],
  clientsById = { 'client-1': client('client-1', 'Marta'), 'client-2': client('client-2', 'Alex') } as Record<string, Client>,
  activePlan = followingPlan('plan-1', 'client-1', 3) as ClientRoutinePlan | null,
} = {}) {
  const templatesById: Record<string, RoutineTemplate> = {
    'tpl-a': template('tpl-a'),
    'tpl-b': template('tpl-b'),
    'tpl-c': template('tpl-c'),
    'tpl-old': template('tpl-old', Status.INACTIVE),
  };
  const memberships = { findActiveByUserAndTenant: vi.fn(async () => member) } as unknown as MembershipRepository;
  const templates = {
    findById: vi.fn(async (tenantId: string, id: string) => (tenantId === TENANT ? templatesById[id] ?? null : null)),
  } as unknown as RoutineTemplateRepository;
  const programs: RoutineProgramRepository = {
    list: vi.fn(async () => Object.values(programsById)),
    findById: vi.fn(async (tenantId: string, id: string) => (tenantId === TENANT ? programsById[id] ?? null : null)),
    create: vi.fn(async (data) => ({ ...program('prog-new', data.templateIds), name: data.name, notes: data.notes ?? null })),
    update: vi.fn(async (_tenantId, id, data) => ({
      ...program(id, data.templateIds ?? programsById[id].items.map((item) => item.templateId), data.status ?? programsById[id].status),
      name: data.name ?? programsById[id].name,
    })),
  };
  const plans: ClientRoutinePlanRepository = {
    findActiveByClient: vi.fn(async () => activePlan),
    findById: vi.fn(async () => activePlan),
    replaceActive: vi.fn(async (data) => ({ ...followingPlan('plan-new', data.clientId, data.nextPosition ?? 1), name: data.name })),
    listActiveByProgram: vi.fn(async () => following),
    deactivate: vi.fn(async () => undefined),
    setNextPosition: vi.fn(async () => undefined),
  };
  const clients = {
    findById: vi.fn(async (tenantId: string, id: string) => (tenantId === TENANT ? clientsById[id] ?? null : null)),
  } as unknown as ClientRepository;
  const auditLogs: AuditLogRepository = { create: vi.fn(async () => undefined) };
  return { memberships, templates, programs, plans, clients, auditLogs };
}

type Deps = ReturnType<typeof setup>;
const createUseCase = (deps: Deps) => new CreateRoutineProgramUseCase(deps.programs, deps.templates, deps.memberships, deps.auditLogs);
const updateUseCase = (deps: Deps) => new UpdateRoutineProgramUseCase(deps.programs, deps.templates, deps.plans, deps.memberships, deps.auditLogs);
const statusUseCase = (deps: Deps) => new SetRoutineProgramStatusUseCase(deps.programs, deps.memberships, deps.auditLogs);
const assignUseCase = (deps: Deps) => new AssignClientRoutinePlanUseCase(
  deps.plans, deps.templates, deps.clients, deps.memberships, deps.auditLogs, deps.programs,
);

describe('routine program input normalization', () => {
  it('trims fields and keeps the template order with repeats', () => {
    expect(normalizeRoutineProgramInput({ name: '  Fuerza 3 días ', notes: '  ', templateIds: [' tpl-a', 'tpl-b', 'tpl-a'] })).toEqual({
      name: 'Fuerza 3 días',
      notes: null,
      templateIds: ['tpl-a', 'tpl-b', 'tpl-a'],
    });
  });

  it('rejects invalid programs', () => {
    expect(() => normalizeRoutineProgramInput(undefined)).toThrow('obligatorio');
    expect(() => normalizeRoutineProgramInput({ name: ' ', templateIds: ['a'] })).toThrow('obligatorio');
    expect(() => normalizeRoutineProgramInput({ name: 'x'.repeat(192), templateIds: ['a'] })).toThrow('191');
    expect(() => normalizeRoutineProgramInput({ name: 'P', notes: 'x'.repeat(2001), templateIds: ['a'] })).toThrow('2000');
    expect(() => normalizeRoutineProgramInput({ name: 'P', templateIds: [] })).toThrow('al menos una rutina para el programa');
    expect(() => normalizeRoutineProgramInput({ name: 'P' })).toThrow('al menos una rutina');
    expect(() => normalizeRoutineProgramInput({ name: 'P', templateIds: Array.from({ length: 11 }, (_, i) => `t${i}`) }))
      .toThrow('Un programa admite como máximo 10 rutinas');
    expect(() => normalizeRoutineProgramInput({ name: 'P', templateIds: ['a', 3] })).toThrow('no es válida');
  });

  it('parses plan assignments as program or custom, never both', () => {
    expect(parseClientRoutinePlanAssignment({ programId: ' prog-1 ', nextPosition: 2 }))
      .toEqual({ kind: 'program', programId: 'prog-1', nextPosition: 2 });
    expect(parseClientRoutinePlanAssignment({ programId: 'prog-1' })).toEqual({ kind: 'program', programId: 'prog-1', nextPosition: 1 });
    expect(parseClientRoutinePlanAssignment({ programId: null, templateIds: ['a'] })).toMatchObject({ kind: 'custom', templateIds: ['a'] });
    expect(parseClientRoutinePlanAssignment({ templateIds: ['a'] })).toMatchObject({ kind: 'custom', nextPosition: 1 });
    expect(() => parseClientRoutinePlanAssignment({ programId: 'prog-1', templateIds: ['a'] })).toThrow('no ambos');
    expect(() => parseClientRoutinePlanAssignment({ programId: ' ' })).toThrow('El programa no es válido');
    expect(() => parseClientRoutinePlanAssignment({ programId: 7 })).toThrow('El programa no es válido');
    expect(() => parseClientRoutinePlanAssignment(null)).toThrow('al menos una rutina para la serie');
  });
});

describe('routine program use cases', () => {
  it('lists and gets programs scoped to the tenant', async () => {
    const deps = setup();
    await new ListRoutineProgramsUseCase(deps.programs).execute(TENANT);
    expect(deps.programs.list).toHaveBeenCalledWith(TENANT, false);
    await new ListRoutineProgramsUseCase(deps.programs).execute(TENANT, true);
    expect(deps.programs.list).toHaveBeenCalledWith(TENANT, true);
    await expect(new GetRoutineProgramUseCase(deps.programs).execute(TENANT, 'prog-1')).resolves.toMatchObject({ id: 'prog-1' });
    await expect(new GetRoutineProgramUseCase(deps.programs).execute('tenant-2', 'prog-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('creates a program with ordered templates and audits it', async () => {
    const deps = setup({ member: membership(Role.TRAINER, true) });
    const created = await createUseCase(deps).execute(TENANT, 'user-1', { name: 'Fuerza', notes: 'Lunes', templateIds: ['tpl-b', 'tpl-a', 'tpl-b'] });
    expect(created.items.map((item) => item.templateId)).toEqual(['tpl-b', 'tpl-a', 'tpl-b']);
    expect(deps.programs.create).toHaveBeenCalledWith({
      tenantId: TENANT, createdById: 'user-1', name: 'Fuerza', notes: 'Lunes', templateIds: ['tpl-b', 'tpl-a', 'tpl-b'],
    });
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'RoutineProgram', entityId: 'prog-new' }));
  });

  it('rejects templates from another tenant or archived', async () => {
    const deps = setup();
    await expect(createUseCase(deps).execute(TENANT, 'user-1', { name: 'P', templateIds: ['tpl-foreign'] })).rejects.toThrow('no existe en este centro');
    await expect(createUseCase(deps).execute(TENANT, 'user-1', { name: 'P', templateIds: ['tpl-a', 'tpl-old'] })).rejects.toThrow('archivada');
    await expect(updateUseCase(deps).execute(TENANT, 'user-1', 'prog-1', { name: 'P', templateIds: ['tpl-old'] })).rejects.toThrow('archivada');
    expect(deps.programs.create).not.toHaveBeenCalled();
    expect(deps.programs.update).not.toHaveBeenCalled();
  });

  it('forbids trainers without the permission before touching data', async () => {
    const deps = setup({ member: membership(Role.TRAINER) });
    await expect(createUseCase(deps).execute(TENANT, 'user-1', { name: 'P', templateIds: ['tpl-a'] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(updateUseCase(deps).execute(TENANT, 'user-1', 'prog-1', { name: 'P', templateIds: ['tpl-a'] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(statusUseCase(deps).execute(TENANT, 'user-1', 'prog-1', Status.INACTIVE)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const noMember = setup({ member: null });
    await expect(createUseCase(noMember).execute(TENANT, 'user-1', { name: 'P', templateIds: ['tpl-a'] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(deps.programs.create).not.toHaveBeenCalled();
    expect(deps.programs.update).not.toHaveBeenCalled();
  });

  it('replaces a program and restarts followers left beyond the new length', async () => {
    const deps = setup();
    const updated = await updateUseCase(deps).execute(TENANT, 'user-1', 'prog-1', { name: 'Fuerza 2 días', templateIds: ['tpl-a', 'tpl-b'] });
    expect(updated.items).toHaveLength(2);
    expect(deps.programs.update).toHaveBeenCalledWith(TENANT, 'prog-1', { name: 'Fuerza 2 días', notes: null, templateIds: ['tpl-a', 'tpl-b'] });
    expect(deps.plans.listActiveByProgram).toHaveBeenCalledWith(TENANT, 'prog-1');
    expect(deps.plans.setNextPosition).toHaveBeenCalledTimes(1);
    expect(deps.plans.setNextPosition).toHaveBeenCalledWith(TENANT, 'plan-1', 1);
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'UPDATE',
      entityType: 'RoutineProgram',
      entityId: 'prog-1',
      metadata: JSON.stringify({ templateIds: ['tpl-a', 'tpl-b'], resetPlanIds: ['plan-1'] }),
    }));

    const longer = setup();
    await updateUseCase(longer).execute(TENANT, 'user-1', 'prog-1', { name: 'P', templateIds: ['tpl-a', 'tpl-b', 'tpl-c', 'tpl-a'] });
    expect(longer.plans.setNextPosition).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a program of another tenant', async () => {
    const deps = setup();
    await expect(updateUseCase(deps).execute('tenant-2', 'user-1', 'prog-1', { name: 'P', templateIds: ['tpl-a'] }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(updateUseCase(deps).execute(TENANT, 'user-1', 'missing', { name: 'P', templateIds: ['tpl-a'] }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('archives and restores programs with a valid status only', async () => {
    const deps = setup();
    await expect(statusUseCase(deps).execute(TENANT, 'user-1', 'prog-1', Status.INACTIVE)).resolves.toMatchObject({ status: Status.INACTIVE });
    await expect(statusUseCase(deps).execute(TENANT, 'user-1', 'prog-old', Status.ACTIVE)).resolves.toMatchObject({ status: Status.ACTIVE });
    await expect(statusUseCase(deps).execute(TENANT, 'user-1', 'prog-1', 'DELETED')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(statusUseCase(deps).execute(TENANT, 'user-1', 'missing', Status.ACTIVE)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(deps.auditLogs.create).toHaveBeenCalledTimes(2);
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'STATUS', entityType: 'RoutineProgram' }));
    expect(deps.plans.deactivate).not.toHaveBeenCalled();
  });

  it('lists the clients following a program sorted by name', async () => {
    const deps = setup({
      following: [followingPlan('plan-1', 'client-1', 3), followingPlan('plan-2', 'client-2', 1), followingPlan('plan-3', 'gone', 2)],
    });
    const list = new ListRoutineProgramClientsUseCase(deps.programs, deps.plans, deps.clients);
    await expect(list.execute(TENANT, 'prog-1')).resolves.toEqual([
      { clientId: 'client-2', firstName: 'Alex', lastName: 'Demo', nextPosition: 1 },
      { clientId: 'client-1', firstName: 'Marta', lastName: 'Demo', nextPosition: 3 },
    ]);
    await expect(list.execute('tenant-2', 'prog-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('assigning a program to a client', () => {
  it('follows the program live with its name and audits the program id', async () => {
    const deps = setup({ member: membership(Role.TRAINER, true) });
    const plan = await assignUseCase(deps).execute(TENANT, 'user-1', 'client-1', { programId: 'prog-1', nextPosition: 3, name: 'ignored' });
    expect(plan.name).toBe('Programa prog-1');
    expect(deps.plans.replaceActive).toHaveBeenCalledWith({
      tenantId: TENANT,
      clientId: 'client-1',
      createdById: 'user-1',
      name: 'Programa prog-1',
      programId: 'prog-1',
      nextPosition: 3,
    });
    expect(deps.templates.findById).not.toHaveBeenCalled();
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ASSIGN',
      entityType: 'ClientRoutinePlan',
      metadata: JSON.stringify({ clientId: 'client-1', programId: 'prog-1', templateIds: null, nextPosition: 3 }),
    }));
  });

  it('keeps custom plans working and records a null program id', async () => {
    const deps = setup();
    await assignUseCase(deps).execute(TENANT, 'user-1', 'client-1', { name: 'Propia', templateIds: ['tpl-a', 'tpl-c'] });
    expect(deps.plans.replaceActive).toHaveBeenCalledWith(expect.objectContaining({ name: 'Propia', templateIds: ['tpl-a', 'tpl-c'], nextPosition: 1 }));
    expect(deps.plans.replaceActive).toHaveBeenCalledWith(expect.not.objectContaining({ programId: expect.anything() }));
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: JSON.stringify({ clientId: 'client-1', programId: null, templateIds: ['tpl-a', 'tpl-c'], nextPosition: 1 }),
    }));
  });

  it('validates the program, its tenant, status and the next position', async () => {
    const deps = setup();
    const assign = assignUseCase(deps);
    await expect(assign.execute(TENANT, 'user-1', 'client-1', { programId: 'missing' })).rejects.toThrow('no existe en este centro');
    await expect(assign.execute(TENANT, 'user-1', 'client-1', { programId: 'prog-old' })).rejects.toThrow('archivado');
    await expect(assign.execute(TENANT, 'user-1', 'client-1', { programId: 'prog-1', nextPosition: 4 })).rejects.toThrow('entre 1 y 3');
    await expect(assign.execute(TENANT, 'user-1', 'client-1', { programId: 'prog-1', templateIds: ['tpl-a'] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(deps.plans.replaceActive).not.toHaveBeenCalled();

    const trainer = setup({ member: membership(Role.TRAINER) });
    await expect(assignUseCase(trainer).execute(TENANT, 'user-1', 'client-1', { programId: 'prog-1' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(assignUseCase(deps).execute('tenant-2', 'user-1', 'client-1', { programId: 'prog-1' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const inactive = setup({ clientsById: { 'client-1': client('client-1', 'Marta', Status.INACTIVE) } });
    await expect(assignUseCase(inactive).execute(TENANT, 'user-1', 'client-1', { programId: 'prog-1' })).rejects.toThrow('no está activo');
  });

  it('bounds the next routine of a program plan by the program length', async () => {
    const deps = setup();
    const setNext = new SetClientRoutinePlanNextUseCase(deps.plans, deps.clients, deps.memberships, deps.auditLogs);
    await expect(setNext.execute(TENANT, 'user-1', 'client-1', 2)).resolves.toMatchObject({ nextPosition: 2, programId: 'prog-1' });
    expect(deps.plans.setNextPosition).toHaveBeenCalledWith(TENANT, 'plan-1', 2);
    await expect(setNext.execute(TENANT, 'user-1', 'client-1', 4)).rejects.toThrow('entre 1 y 3');
  });
});
