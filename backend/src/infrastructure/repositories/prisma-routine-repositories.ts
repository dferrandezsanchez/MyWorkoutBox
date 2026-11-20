import type { Prisma } from '@prisma/client';
import type {
  ClientRoutinePlanRepository,
  RoutineProgramRepository,
  RoutineTemplateExerciseInput,
  RoutineTemplateRepository,
} from '../../domain/repositories';
import type { ClientRoutinePlan, RoutineProgram, RoutineTemplate } from '../../domain/shared/entities';
import type { Status } from '../../domain/shared/enums';
import prisma from '../prisma/prisma-client';
import { runTransaction } from '../prisma/transaction';
import { toExercise } from './prisma-repositories';

const templateInclude = {
  exercises: { orderBy: { position: 'asc' as const }, include: { exercise: true } },
} satisfies Prisma.RoutineTemplateInclude;

type TemplateRecord = Prisma.RoutineTemplateGetPayload<{ include: typeof templateInclude }>;

const programItemsInclude = {
  orderBy: { position: 'asc' as const },
  include: { template: { include: templateInclude } },
};

const programInclude = {
  items: programItemsInclude,
  _count: { select: { plans: { where: { active: true } } } },
} satisfies Prisma.RoutineProgramInclude;

type ProgramRecord = Prisma.RoutineProgramGetPayload<{ include: typeof programInclude }>;

const planInclude = {
  items: { orderBy: { position: 'asc' as const }, include: { template: { include: templateInclude } } },
  program: { include: { items: programItemsInclude } },
} satisfies Prisma.ClientRoutinePlanInclude;

type PlanRecord = Prisma.ClientRoutinePlanGetPayload<{ include: typeof planInclude }>;

function exerciseRows(exercises: RoutineTemplateExerciseInput[]) {
  return exercises.map((item, index) => ({
    exerciseId: item.exerciseId,
    position: index + 1,
    targetSets: item.targetSets ?? null,
    targetReps: item.targetReps ?? null,
    notes: item.notes ?? null,
  }));
}

export class PrismaRoutineTemplateRepository implements RoutineTemplateRepository {
  async list(tenantId: string, includeInactive: boolean): Promise<RoutineTemplate[]> {
    const templates = await prisma.routineTemplate.findMany({
      where: { tenantId, ...(includeInactive ? {} : { status: 'ACTIVE' }) },
      orderBy: { name: 'asc' },
      include: templateInclude,
    });
    return templates.map(toRoutineTemplate);
  }

  async findById(tenantId: string, id: string): Promise<RoutineTemplate | null> {
    const template = await prisma.routineTemplate.findFirst({ where: { tenantId, id }, include: templateInclude });
    return template ? toRoutineTemplate(template) : null;
  }

  async create(data: {
    tenantId: string;
    name: string;
    notes?: string | null;
    createdById: string;
    exercises: RoutineTemplateExerciseInput[];
  }): Promise<RoutineTemplate> {
    const template = await prisma.routineTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        notes: data.notes ?? null,
        createdById: data.createdById,
        exercises: { create: exerciseRows(data.exercises) },
      },
      include: templateInclude,
    });
    return toRoutineTemplate(template);
  }

  async update(tenantId: string, id: string, data: {
    name?: string;
    notes?: string | null;
    status?: Status;
    exercises?: RoutineTemplateExerciseInput[];
  }): Promise<RoutineTemplate> {
    const template = await runTransaction(async (tx) => {
      await tx.routineTemplate.updateMany({
        where: { tenantId, id },
        data: { name: data.name, notes: data.notes, status: data.status },
      });
      if (data.exercises) {
        await tx.routineTemplateExercise.deleteMany({ where: { templateId: id } });
        await tx.routineTemplateExercise.createMany({
          data: exerciseRows(data.exercises).map((row) => ({ ...row, templateId: id })),
        });
      }
      return tx.routineTemplate.findFirstOrThrow({ where: { tenantId, id }, include: templateInclude });
    });
    return toRoutineTemplate(template);
  }
}

export class PrismaClientRoutinePlanRepository implements ClientRoutinePlanRepository {
  async findActiveByClient(tenantId: string, clientId: string): Promise<ClientRoutinePlan | null> {
    const plan = await prisma.clientRoutinePlan.findFirst({
      where: { tenantId, clientId, active: true },
      orderBy: { createdAt: 'desc' },
      include: planInclude,
    });
    return plan ? toClientRoutinePlan(plan) : null;
  }

  async findById(tenantId: string, id: string): Promise<ClientRoutinePlan | null> {
    const plan = await prisma.clientRoutinePlan.findFirst({ where: { tenantId, id }, include: planInclude });
    return plan ? toClientRoutinePlan(plan) : null;
  }

  async listActiveByProgram(tenantId: string, programId: string): Promise<ClientRoutinePlan[]> {
    const plans = await prisma.clientRoutinePlan.findMany({
      where: { tenantId, programId, active: true },
      orderBy: { createdAt: 'asc' },
      include: planInclude,
    });
    return plans.map(toClientRoutinePlan);
  }

  async replaceActive(data: {
    tenantId: string;
    clientId: string;
    name: string;
    createdById: string;
    templateIds?: string[];
    programId?: string;
    nextPosition?: number;
  }): Promise<ClientRoutinePlan> {
    const plan = await runTransaction(async (tx) => {
      // Deactivate by primary key: a range update on the (tenantId, clientId, active) index takes
      // gap locks that deadlock with concurrent plan inserts for other clients.
      const current = await tx.clientRoutinePlan.findMany({
        where: { tenantId: data.tenantId, clientId: data.clientId, active: true },
        select: { id: true },
      });
      for (const { id } of current) {
        await tx.clientRoutinePlan.update({ where: { id }, data: { active: false } });
      }
      return tx.clientRoutinePlan.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          name: data.name,
          createdById: data.createdById,
          nextPosition: data.nextPosition ?? 1,
          programId: data.programId ?? null,
          items: data.programId
            ? undefined
            : { create: (data.templateIds ?? []).map((templateId, index) => ({ templateId, position: index + 1 })) },
        },
        include: planInclude,
      });
    });
    return toClientRoutinePlan(plan);
  }

  async deactivate(tenantId: string, id: string): Promise<void> {
    await prisma.clientRoutinePlan.updateMany({ where: { tenantId, id }, data: { active: false } });
  }

  async setNextPosition(tenantId: string, id: string, nextPosition: number): Promise<void> {
    await prisma.clientRoutinePlan.updateMany({ where: { tenantId, id }, data: { nextPosition } });
  }
}

export class PrismaRoutineProgramRepository implements RoutineProgramRepository {
  async list(tenantId: string, includeInactive: boolean): Promise<RoutineProgram[]> {
    const programs = await prisma.routineProgram.findMany({
      where: { tenantId, ...(includeInactive ? {} : { status: 'ACTIVE' }) },
      orderBy: { name: 'asc' },
      include: programInclude,
    });
    return programs.map(toRoutineProgram);
  }

  async findById(tenantId: string, id: string): Promise<RoutineProgram | null> {
    const program = await prisma.routineProgram.findFirst({ where: { tenantId, id }, include: programInclude });
    return program ? toRoutineProgram(program) : null;
  }

  async create(data: { tenantId: string; name: string; notes?: string | null; createdById: string; templateIds: string[] }): Promise<RoutineProgram> {
    const program = await prisma.routineProgram.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        notes: data.notes ?? null,
        createdById: data.createdById,
        items: { create: data.templateIds.map((templateId, index) => ({ templateId, position: index + 1 })) },
      },
      include: programInclude,
    });
    return toRoutineProgram(program);
  }

  async update(tenantId: string, id: string, data: { name?: string; notes?: string | null; status?: Status; templateIds?: string[] }): Promise<RoutineProgram> {
    const program = await runTransaction(async (tx) => {
      await tx.routineProgram.updateMany({
        where: { tenantId, id },
        data: { name: data.name, notes: data.notes, status: data.status },
      });
      if (data.templateIds) {
        await tx.routineProgramItem.deleteMany({ where: { programId: id } });
        await tx.routineProgramItem.createMany({
          data: data.templateIds.map((templateId, index) => ({ programId: id, templateId, position: index + 1 })),
        });
      }
      return tx.routineProgram.findFirstOrThrow({ where: { tenantId, id }, include: programInclude });
    });
    return toRoutineProgram(program);
  }
}

function toRoutineProgram(program: ProgramRecord): RoutineProgram {
  return {
    id: program.id,
    tenantId: program.tenantId,
    name: program.name,
    notes: program.notes,
    status: program.status as Status,
    createdById: program.createdById,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    items: program.items.map((item) => ({
      id: item.id,
      programId: item.programId,
      templateId: item.templateId,
      position: item.position,
      template: toRoutineTemplate(item.template),
    })),
    activeClientCount: program._count.plans,
  };
}

function toRoutineTemplate(template: TemplateRecord): RoutineTemplate {
  return {
    id: template.id,
    tenantId: template.tenantId,
    name: template.name,
    notes: template.notes,
    status: template.status as Status,
    createdById: template.createdById,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    exercises: template.exercises.map((item) => ({
      id: item.id,
      templateId: item.templateId,
      exerciseId: item.exerciseId,
      position: item.position,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      notes: item.notes,
      createdAt: item.createdAt,
      exercise: toExercise(item.exercise),
    })),
  };
}

function toClientRoutinePlan(plan: PlanRecord): ClientRoutinePlan {
  return {
    id: plan.id,
    tenantId: plan.tenantId,
    clientId: plan.clientId,
    name: plan.name,
    active: plan.active,
    nextPosition: plan.nextPosition,
    programId: plan.programId,
    program: plan.program ? { id: plan.program.id, name: plan.program.name, status: plan.program.status as Status } : null,
    createdById: plan.createdById,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    // A plan that follows a program exposes the program's current items as its own.
    items: (plan.program ? plan.program.items : plan.items).map((item) => ({
      id: item.id,
      planId: plan.id,
      templateId: item.templateId,
      position: item.position,
      template: toRoutineTemplate(item.template),
    })),
  };
}
