import { describe, expect, it, vi } from 'vitest';
import type {
  AuditLogRepository,
  ClientRepository,
  ClientRoutinePlanRepository,
  ExerciseRepository,
  MembershipRepository,
  RoutineTemplateRepository,
} from '../../domain/repositories';
import type { Client, ClientRoutinePlan, Exercise, Membership, RoutineTemplate } from '../../domain/shared/entities';
import { Role, Status } from '../../domain/shared/enums';
import {
  AssignClientRoutinePlanUseCase,
  CreateRoutineTemplateUseCase,
  DEFAULT_PLAN_NAME,
  GetClientRoutinePlanUseCase,
  GetRoutineTemplateUseCase,
  ListRoutineTemplatesUseCase,
  RemoveClientRoutinePlanUseCase,
  SetClientRoutinePlanNextUseCase,
  SetRoutineTemplateStatusUseCase,
  UpdateRoutineTemplateUseCase,
  isRoutineManager,
  normalizeClientRoutinePlanInput,
  normalizeRoutineTemplateInput,
  requireRoutineManager,
} from './index';

const NOW = new Date('2026-11-20T10:00:00.000Z');
const TENANT = 'tenant-1';

function exercise(id: string, status = Status.ACTIVE): Exercise {
  return { id, tenantId: TENANT, name: `Ejercicio ${id}`, status } as Exercise;
}

function template(id: string, status = Status.ACTIVE): RoutineTemplate {
  return {
    id,
    tenantId: TENANT,
    name: `Rutina ${id}`,
    notes: null,
    status,
    createdById: 'admin-1',
    createdAt: NOW,
    updatedAt: NOW,
    exercises: [],
  };
}

function membership(role: Role, canManageRoutines = false, active = true): Membership {
  return { id: 'm-1', userId: 'user-1', tenantId: TENANT, role, canManageRoutines, active, createdAt: NOW, updatedAt: NOW };
}

const activeClient = { id: 'client-1', tenantId: TENANT, status: Status.ACTIVE } as Client;

function plan(overrides: Partial<ClientRoutinePlan> = {}): ClientRoutinePlan {
  return {
    id: 'plan-1',
    tenantId: TENANT,
    clientId: 'client-1',
    name: DEFAULT_PLAN_NAME,
    active: true,
    nextPosition: 1,
    createdById: 'admin-1',
    createdAt: NOW,
    updatedAt: NOW,
    items: [
      { id: 'i-1', planId: 'plan-1', templateId: 'tpl-a', position: 1 },
      { id: 'i-2', planId: 'plan-1', templateId: 'tpl-b', position: 2 },
    ],
    ...overrides,
  };
}

function setup({
  member = membership(Role.ADMIN) as Membership | null,
  catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-old', Status.INACTIVE)],
  templatesById = { 'tpl-a': template('tpl-a'), 'tpl-b': template('tpl-b'), 'tpl-old': template('tpl-old', Status.INACTIVE) } as Record<string, RoutineTemplate>,
  client = activeClient as Client | null,
  activePlan = plan() as ClientRoutinePlan | null,
} = {}) {
  const memberships = { findActiveByUserAndTenant: vi.fn(async () => member) } as unknown as MembershipRepository;
  const exercises = { list: vi.fn(async () => catalog) } as unknown as ExerciseRepository;
  const templates: RoutineTemplateRepository = {
    list: vi.fn(async () => Object.values(templatesById)),
    findById: vi.fn(async (tenantId: string, id: string) => (tenantId === TENANT ? templatesById[id] ?? null : null)),
    create: vi.fn(async (data) => ({ ...template('tpl-new'), name: data.name, exercises: data.exercises.map((item, index) => ({
      id: `rte-${index}`, templateId: 'tpl-new', position: index + 1, createdAt: NOW,
      exerciseId: item.exerciseId, targetSets: item.targetSets ?? null, targetReps: item.targetReps ?? null, notes: item.notes ?? null,
    })) })),
    update: vi.fn(async (_tenantId, id, data) => ({ ...templatesById[id], ...(data.status ? { status: data.status } : {}), name: data.name ?? templatesById[id].name })),
  };
  const plans: ClientRoutinePlanRepository = {
    findActiveByClient: vi.fn(async () => activePlan),
    findById: vi.fn(async () => activePlan),
    replaceActive: vi.fn(async (data) => plan({ id: 'plan-new', name: data.name, nextPosition: data.nextPosition ?? 1 })),
    deactivate: vi.fn(async () => undefined),
    setNextPosition: vi.fn(async () => undefined),
  };
  const clients = { findById: vi.fn(async (tenantId: string) => (tenantId === TENANT ? client : null)) } as unknown as ClientRepository;
  const auditLogs: AuditLogRepository = { create: vi.fn(async () => undefined) };
  return { memberships, exercises, templates, plans, clients, auditLogs };
}

describe('routine permissions', () => {
  it('lets admins and trainers with the permission manage routines', () => {
    expect(isRoutineManager(membership(Role.ADMIN))).toBe(true);
    expect(isRoutineManager(membership(Role.TRAINER, true))).toBe(true);
    expect(isRoutineManager(membership(Role.TRAINER, false))).toBe(false);
    expect(isRoutineManager(membership(Role.ADMIN, true, false))).toBe(false);
    expect(isRoutineManager(null)).toBe(false);
  });

  it('requires an active membership in the tenant', async () => {
    const { memberships } = setup({ member: null });
    await expect(requireRoutineManager(memberships, TENANT, 'user-1')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const allowed = setup({ member: membership(Role.TRAINER, true) });
    await expect(requireRoutineManager(allowed.memberships, TENANT, 'user-1')).resolves.toMatchObject({ role: Role.TRAINER });
    expect(allowed.memberships.findActiveByUserAndTenant).toHaveBeenCalledWith('user-1', TENANT);
  });
});

describe('routine input normalization', () => {
  it('trims and keeps the exercise order with optional targets', () => {
    expect(normalizeRoutineTemplateInput({
      name: '  Rutina A  ',
      notes: '  ',
      exercises: [
        { exerciseId: 'ex-2', targetSets: '4', targetReps: ' 8-10 ' },
        { exerciseId: 'ex-1', targetSets: null, targetReps: 12 },
      ],
    })).toEqual({
      name: 'Rutina A',
      notes: null,
      exercises: [
        { exerciseId: 'ex-2', targetSets: 4, targetReps: '8-10', notes: null },
        { exerciseId: 'ex-1', targetSets: null, targetReps: '12', notes: null },
      ],
    });
  });

  it('rejects invalid templates', () => {
    expect(() => normalizeRoutineTemplateInput({ name: ' ', exercises: [{ exerciseId: 'ex-1' }] })).toThrow('obligatorio');
    expect(() => normalizeRoutineTemplateInput({ name: 'x'.repeat(192), exercises: [{ exerciseId: 'ex-1' }] })).toThrow('191');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [] })).toThrow('al menos un ejercicio');
    expect(() => normalizeRoutineTemplateInput({ name: 'A' })).toThrow('al menos un ejercicio');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{ exerciseId: 'ex-1' }, { exerciseId: 'ex-1' }] })).toThrow('repetirse');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{}] })).toThrow('necesita un ejercicio');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{ exerciseId: 'ex-1', targetSets: 0 }] })).toThrow('entre 1 y 20');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{ exerciseId: 'ex-1', targetSets: 21 }] })).toThrow('entre 1 y 20');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{ exerciseId: 'ex-1', targetSets: 2.5 }] })).toThrow('entre 1 y 20');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{ exerciseId: 'ex-1', targetReps: 'x'.repeat(65) }] })).toThrow('64');
    expect(() => normalizeRoutineTemplateInput({ name: 'A', exercises: [{ exerciseId: 'ex-1', notes: 3 }] })).toThrow('no es válido');
  });

  it('defaults the plan name and validates templates and next position', () => {
    expect(normalizeClientRoutinePlanInput({ name: ' ', templateIds: ['a', 'b', 'a'] })).toEqual({
      name: DEFAULT_PLAN_NAME,
      templateIds: ['a', 'b', 'a'],
      nextPosition: 1,
    });
    expect(normalizeClientRoutinePlanInput({ name: 'Bloque 1', templateIds: ['a', 'b'], nextPosition: '2' }).nextPosition).toBe(2);
    expect(() => normalizeClientRoutinePlanInput({ templateIds: [] })).toThrow('al menos una rutina');
    expect(() => normalizeClientRoutinePlanInput({ templateIds: Array.from({ length: 11 }, (_, i) => `t${i}`) })).toThrow('10');
    expect(() => normalizeClientRoutinePlanInput({ templateIds: ['a', ''] })).toThrow('no es válida');
    expect(() => normalizeClientRoutinePlanInput({ templateIds: ['a', 'b'], nextPosition: 3 })).toThrow('entre 1 y 2');
    expect(() => normalizeClientRoutinePlanInput({ templateIds: ['a'], nextPosition: 0 })).toThrow('entre 1 y 1');
    expect(() => normalizeClientRoutinePlanInput({ name: 'x'.repeat(192), templateIds: ['a'] })).toThrow('191');
  });
});

describe('routine template use cases', () => {
  it('lists and gets templates scoped to the tenant', async () => {
    const deps = setup();
    await new ListRoutineTemplatesUseCase(deps.templates).execute(TENANT, true);
    expect(deps.templates.list).toHaveBeenCalledWith(TENANT, true);
    await expect(new GetRoutineTemplateUseCase(deps.templates).execute(TENANT, 'tpl-a')).resolves.toMatchObject({ id: 'tpl-a' });
    await expect(new GetRoutineTemplateUseCase(deps.templates).execute('tenant-2', 'tpl-a')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('creates a template with ordered exercises and audits it', async () => {
    const deps = setup({ member: membership(Role.TRAINER, true) });
    const created = await new CreateRoutineTemplateUseCase(deps.templates, deps.exercises, deps.memberships, deps.auditLogs)
      .execute(TENANT, 'user-1', { name: 'Rutina A', exercises: [{ exerciseId: 'ex-2' }, { exerciseId: 'ex-1', targetSets: 3 }] });

    expect(created.exercises.map((item) => item.exerciseId)).toEqual(['ex-2', 'ex-1']);
    expect(deps.templates.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: TENANT, createdById: 'user-1', name: 'Rutina A' }));
    expect(deps.exercises.list).toHaveBeenCalledWith(TENANT, true);
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'RoutineTemplate', entityId: 'tpl-new' }));
  });

  it('forbids trainers without the permission before touching data', async () => {
    const deps = setup({ member: membership(Role.TRAINER, false) });
    const create = new CreateRoutineTemplateUseCase(deps.templates, deps.exercises, deps.memberships, deps.auditLogs);
    await expect(create.execute(TENANT, 'user-1', { name: 'A', exercises: [{ exerciseId: 'ex-1' }] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const update = new UpdateRoutineTemplateUseCase(deps.templates, deps.exercises, deps.memberships, deps.auditLogs);
    await expect(update.execute(TENANT, 'user-1', 'tpl-a', { name: 'A', exercises: [{ exerciseId: 'ex-1' }] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const setStatus = new SetRoutineTemplateStatusUseCase(deps.templates, deps.memberships, deps.auditLogs);
    await expect(setStatus.execute(TENANT, 'user-1', 'tpl-a', Status.INACTIVE)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(deps.templates.create).not.toHaveBeenCalled();
    expect(deps.templates.update).not.toHaveBeenCalled();
  });

  it('rejects exercises from another tenant or archived', async () => {
    const deps = setup();
    const create = new CreateRoutineTemplateUseCase(deps.templates, deps.exercises, deps.memberships, deps.auditLogs);
    await expect(create.execute(TENANT, 'user-1', { name: 'A', exercises: [{ exerciseId: 'ex-foreign' }] })).rejects.toThrow('no existe en este centro');
    await expect(create.execute(TENANT, 'user-1', { name: 'A', exercises: [{ exerciseId: 'ex-old' }] })).rejects.toThrow('archivado');
    expect(deps.templates.create).not.toHaveBeenCalled();
  });

  it('replaces a template and returns 404 for unknown ones', async () => {
    const deps = setup();
    const update = new UpdateRoutineTemplateUseCase(deps.templates, deps.exercises, deps.memberships, deps.auditLogs);
    await update.execute(TENANT, 'user-1', 'tpl-a', { name: 'Nueva', notes: 'Calentar', exercises: [{ exerciseId: 'ex-1' }] });
    expect(deps.templates.update).toHaveBeenCalledWith(TENANT, 'tpl-a', {
      name: 'Nueva',
      notes: 'Calentar',
      exercises: [{ exerciseId: 'ex-1', targetSets: null, targetReps: null, notes: null }],
    });
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityType: 'RoutineTemplate' }));
    await expect(update.execute(TENANT, 'user-1', 'missing', { name: 'A', exercises: [{ exerciseId: 'ex-1' }] })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('archives and restores templates with a valid status only', async () => {
    const deps = setup();
    const setStatus = new SetRoutineTemplateStatusUseCase(deps.templates, deps.memberships, deps.auditLogs);
    await expect(setStatus.execute(TENANT, 'user-1', 'tpl-a', Status.INACTIVE)).resolves.toMatchObject({ status: Status.INACTIVE });
    await expect(setStatus.execute(TENANT, 'user-1', 'tpl-old', Status.ACTIVE)).resolves.toMatchObject({ status: Status.ACTIVE });
    await expect(setStatus.execute(TENANT, 'user-1', 'tpl-a', 'DELETED')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(setStatus.execute(TENANT, 'user-1', 'missing', Status.ACTIVE)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(deps.auditLogs.create).toHaveBeenCalledTimes(2);
  });
});

describe('client routine plan use cases', () => {
  it('returns the active plan or null and hides other tenants clients', async () => {
    const deps = setup();
    const get = new GetClientRoutinePlanUseCase(deps.plans, deps.clients);
    await expect(get.execute(TENANT, 'client-1')).resolves.toMatchObject({ id: 'plan-1' });
    await expect(get.execute('tenant-2', 'client-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const empty = setup({ activePlan: null });
    await expect(new GetClientRoutinePlanUseCase(empty.plans, empty.clients).execute(TENANT, 'client-1')).resolves.toBeNull();
  });

  it('assigns a plan allowing repeated templates and audits it', async () => {
    const deps = setup({ member: membership(Role.TRAINER, true) });
    const assign = new AssignClientRoutinePlanUseCase(deps.plans, deps.templates, deps.clients, deps.memberships, deps.auditLogs);
    await assign.execute(TENANT, 'user-1', 'client-1', { templateIds: ['tpl-a', 'tpl-b', 'tpl-a'], nextPosition: 3 });
    expect(deps.plans.replaceActive).toHaveBeenCalledWith({
      tenantId: TENANT,
      clientId: 'client-1',
      createdById: 'user-1',
      name: DEFAULT_PLAN_NAME,
      templateIds: ['tpl-a', 'tpl-b', 'tpl-a'],
      nextPosition: 3,
    });
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASSIGN', entityType: 'ClientRoutinePlan', entityId: 'plan-new' }));
  });

  it('validates permission, client and templates when assigning', async () => {
    const input = { templateIds: ['tpl-a'] };
    const forbiddenDeps = setup({ member: membership(Role.TRAINER) });
    await expect(new AssignClientRoutinePlanUseCase(forbiddenDeps.plans, forbiddenDeps.templates, forbiddenDeps.clients, forbiddenDeps.memberships, forbiddenDeps.auditLogs)
      .execute(TENANT, 'user-1', 'client-1', input)).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const missingClient = setup({ client: null });
    await expect(new AssignClientRoutinePlanUseCase(missingClient.plans, missingClient.templates, missingClient.clients, missingClient.memberships, missingClient.auditLogs)
      .execute(TENANT, 'user-1', 'client-1', input)).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const inactiveClient = setup({ client: { ...activeClient, status: Status.INACTIVE } });
    await expect(new AssignClientRoutinePlanUseCase(inactiveClient.plans, inactiveClient.templates, inactiveClient.clients, inactiveClient.memberships, inactiveClient.auditLogs)
      .execute(TENANT, 'user-1', 'client-1', input)).rejects.toThrow('no está activo');

    const deps = setup();
    const assign = new AssignClientRoutinePlanUseCase(deps.plans, deps.templates, deps.clients, deps.memberships, deps.auditLogs);
    await expect(assign.execute(TENANT, 'user-1', 'client-1', { templateIds: ['tpl-foreign'] })).rejects.toThrow('no existe en este centro');
    await expect(assign.execute(TENANT, 'user-1', 'client-1', { templateIds: ['tpl-a', 'tpl-old'] })).rejects.toThrow('archivada');
    expect(deps.plans.replaceActive).not.toHaveBeenCalled();
  });

  it('removes the active plan and fails when there is none', async () => {
    const deps = setup();
    const remove = new RemoveClientRoutinePlanUseCase(deps.plans, deps.clients, deps.memberships, deps.auditLogs);
    await remove.execute(TENANT, 'user-1', 'client-1');
    expect(deps.plans.deactivate).toHaveBeenCalledWith(TENANT, 'plan-1');
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'REMOVE', entityType: 'ClientRoutinePlan' }));

    const empty = setup({ activePlan: null });
    await expect(new RemoveClientRoutinePlanUseCase(empty.plans, empty.clients, empty.memberships, empty.auditLogs)
      .execute(TENANT, 'user-1', 'client-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const trainer = setup({ member: membership(Role.TRAINER) });
    await expect(new RemoveClientRoutinePlanUseCase(trainer.plans, trainer.clients, trainer.memberships, trainer.auditLogs)
      .execute(TENANT, 'user-1', 'client-1')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('changes the next routine within the plan bounds', async () => {
    const deps = setup();
    const setNext = new SetClientRoutinePlanNextUseCase(deps.plans, deps.clients, deps.memberships, deps.auditLogs);
    await expect(setNext.execute(TENANT, 'user-1', 'client-1', 2)).resolves.toMatchObject({ nextPosition: 2 });
    expect(deps.plans.setNextPosition).toHaveBeenCalledWith(TENANT, 'plan-1', 2);
    await expect(setNext.execute(TENANT, 'user-1', 'client-1', 3)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(setNext.execute(TENANT, 'user-1', 'client-1', undefined)).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    const trainer = setup({ member: membership(Role.TRAINER) });
    await expect(new SetClientRoutinePlanNextUseCase(trainer.plans, trainer.clients, trainer.memberships, trainer.auditLogs)
      .execute(TENANT, 'user-1', 'client-1', 1)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
