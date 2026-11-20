import type {
  AuditLogRepository,
  ClientRepository,
  CreateClientData,
  CreateExerciseData,
  ExerciseRepository,
  MembershipRepository,
  PerformanceRepository,
  TenantRepository,
  TrainingSessionRepository,
  UpdateClientData,
  UpdateExerciseData,
  UserRepository,
} from '../../domain/repositories';
import type {
  Client,
  Exercise,
  Membership,
  PerformanceRecord,
  PerformanceRecordWithTrainerName,
  Tenant,
  TrainingSession,
  TrainingSessionDetail,
  TrainingSessionExercise,
  User,
} from '../../domain/shared/entities';
import { Role, Status } from '../../domain/shared/enums';
import { lastAdminConflict } from '../../domain/shared/errors';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma/prisma-client';
import { runTransaction } from '../prisma/transaction';

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? toUser(user) : null;
  }

  async createTrainer(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    active: boolean;
  }): Promise<User> {
    const user = await prisma.user.create({ data: input });
    return toUser(user);
  }

  async upsertTrainer(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    active: boolean;
  }): Promise<User> {
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: { name: input.name, active: input.active },
      create: input,
    });
    return toUser(user);
  }

  async update(
    id: string,
    data: { name?: string; email?: string; active?: boolean; passwordHash?: string },
  ): Promise<User> {
    const user = await prisma.user.update({ where: { id }, data });
    return toUser(user);
  }
}

export class PrismaMembershipRepository implements MembershipRepository {
  async findActiveByUser(userId: string): Promise<Membership[]> {
    const memberships = await prisma.userTenantMembership.findMany({
      where: {
        userId,
        active: true,
        tenant: { active: true, organization: { active: true } },
      },
      include: { tenant: { include: { organization: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(toMembership);
  }

  async findActiveByUserAndTenant(userId: string, tenantId: string): Promise<Membership | null> {
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId,
        tenantId,
        active: true,
        tenant: { active: true, organization: { active: true } },
      },
      include: { tenant: true },
    });
    return membership ? toMembership(membership) : null;
  }

  async findByUserAndTenant(userId: string, tenantId: string): Promise<Membership | null> {
    const membership = await prisma.userTenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      include: { user: true, tenant: true },
    });
    return membership ? toMembership(membership) : null;
  }

  async upsert(input: { userId: string; tenantId: string; role: Role; active: boolean }): Promise<Membership> {
    const membership = await prisma.userTenantMembership.upsert({
      where: { userId_tenantId: { userId: input.userId, tenantId: input.tenantId } },
      update: { role: input.role, active: input.active },
      create: input,
    });
    return toMembership(membership);
  }

  async updateActive(userId: string, tenantId: string, active: boolean): Promise<void> {
    await updateMembershipKeepingAnAdmin(userId, tenantId, { active });
  }

  async findTrainers(tenantId: string, includeInactive: boolean): Promise<Membership[]> {
    const memberships = await prisma.userTenantMembership.findMany({
      where: {
        tenantId,
        role: Role.TRAINER,
        ...(includeInactive ? {} : { active: true }),
        user: includeInactive ? undefined : { active: true },
      },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    });
    return memberships.map(toMembership);
  }

  async findStaff(tenantId: string, includeInactive: boolean): Promise<Membership[]> {
    const memberships = await prisma.userTenantMembership.findMany({
      where: {
        tenantId,
        role: { in: [Role.ADMIN, Role.TRAINER] },
        ...(includeInactive ? {} : { active: true }),
        user: includeInactive ? undefined : { active: true },
      },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    });
    return memberships.map(toMembership);
  }

  async updateAccess(userId: string, tenantId: string, data: { role?: Role; canManageRoutines?: boolean }): Promise<Membership> {
    return toMembership(await updateMembershipKeepingAnAdmin(userId, tenantId, data));
  }

  countActiveAdmins(tenantId: string): Promise<number> {
    return prisma.userTenantMembership.count({
      where: { tenantId, role: Role.ADMIN, active: true, user: { active: true } },
    });
  }
}

/**
 * Updates a membership inside a transaction that locks the tenant's ADMIN memberships, so two
 * concurrent demotions/deactivations cannot both pass. Counts use locking reads, which always see
 * the latest committed rows. Rolls back with `lastAdminConflict()` when the tenant had active
 * admins before the change and would have none after it.
 */
async function updateMembershipKeepingAnAdmin(
  userId: string,
  tenantId: string,
  data: { role?: Role; canManageRoutines?: boolean; active?: boolean },
) {
  return runTransaction(async (tx) => {
    const countActiveAdmins = async () => {
      const rows = await tx.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS total
        FROM user_tenant_memberships m
        JOIN users u ON u.id = m.userId
        WHERE m.tenantId = ${tenantId} AND m.role = ${Role.ADMIN} AND m.active = true AND u.active = true
        FOR UPDATE`;
      return Number(rows[0]?.total ?? 0);
    };

    await tx.$queryRaw`
      SELECT id FROM user_tenant_memberships
      WHERE tenantId = ${tenantId} AND (role = ${Role.ADMIN} OR userId = ${userId})
      FOR UPDATE`;
    const before = await countActiveAdmins();
    const membership = await tx.userTenantMembership.update({
      where: { userId_tenantId: { userId, tenantId } },
      data,
      include: { user: true },
    });
    if (before > 0 && (await countActiveAdmins()) === 0) throw lastAdminConflict();
    return membership;
  });
}

export class PrismaTenantRepository implements TenantRepository {
  async findActiveById(id: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findFirst({ where: { id, active: true } });
    return tenant ? toTenant(tenant) : null;
  }

  async updateSettings(tenantId: string, data: { name?: string; measurementsEnabled?: boolean }): Promise<void> {
    await prisma.tenant.update({ where: { id: tenantId }, data });
  }
}

export class PrismaClientRepository implements ClientRepository {
  async list(tenantId: string, options: { query?: string; includeInactive: boolean }): Promise<Client[]> {
    const statusFilter = options.includeInactive ? undefined : Status.ACTIVE;
    const query = options.query?.trim();
    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(query
          ? {
              OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { lastName: 'asc' },
    });
    return clients.map(toClient);
  }

  async findById(tenantId: string, id: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({ where: { id, tenantId } });
    return client ? toClient(client) : null;
  }

  async create(tenantId: string, data: CreateClientData): Promise<Client> {
    const client = await prisma.client.create({ data: { ...data, tenantId } });
    return toClient(client);
  }

  async update(_tenantId: string, id: string, data: UpdateClientData): Promise<Client> {
    const client = await prisma.client.update({ where: { id }, data });
    return toClient(client);
  }
}

export class PrismaExerciseRepository implements ExerciseRepository {
  async list(tenantId: string, includeInactive: boolean): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { status: Status.ACTIVE }),
      },
      orderBy: { name: 'asc' },
    });
    return exercises.map(toExercise);
  }

  async findById(tenantId: string, id: string): Promise<Exercise | null> {
    const exercise = await prisma.exercise.findFirst({ where: { id, tenantId } });
    return exercise ? toExercise(exercise) : null;
  }

  async create(tenantId: string, data: CreateExerciseData): Promise<Exercise> {
    const exercise = await prisma.exercise.create({ data: { ...data, tenantId } });
    return toExercise(exercise);
  }

  async createMany(tenantId: string, data: CreateExerciseData[]): Promise<number> {
    if (data.length === 0) return 0;
    const result = await prisma.exercise.createMany({ data: data.map((exercise) => ({ ...exercise, tenantId })) });
    return result.count;
  }

  async update(_tenantId: string, id: string, data: UpdateExerciseData): Promise<Exercise> {
    const exercise = await prisma.exercise.update({ where: { id }, data });
    return toExercise(exercise);
  }
}

export class PrismaPerformanceRepository implements PerformanceRepository {
  async findByClientAndExercise(
    tenantId: string,
    clientId: string,
    exerciseId: string,
  ): Promise<PerformanceRecordWithTrainerName[]> {
    const records = await prisma.performanceRecord.findMany({
      where: { tenantId, clientId, exerciseId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { trainer: { select: { name: true } } },
    });
    return records.map(toPerformanceWithTrainerName);
  }

  async findLatestByClientExercise(
    tenantId: string,
    clientId: string,
    exerciseId: string,
  ): Promise<PerformanceRecordWithTrainerName | null> {
    const record = await prisma.performanceRecord.findFirst({
      where: { tenantId, clientId, exerciseId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { trainer: { select: { name: true } } },
    });
    return record ? toPerformanceWithTrainerName(record) : null;
  }

  async findByClient(tenantId: string, clientId: string): Promise<PerformanceRecord[]> {
    const records = await prisma.performanceRecord.findMany({ where: { tenantId, clientId } });
    return records.map(toPerformance);
  }

  async findByClientWithTrainer(tenantId: string, clientId: string): Promise<PerformanceRecordWithTrainerName[]> {
    const records = await prisma.performanceRecord.findMany({
      where: { tenantId, clientId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { trainer: { select: { name: true } } },
    });
    return records.map(toPerformanceWithTrainerName);
  }

  async create(data: {
    tenantId: string;
    clientId: string;
    exerciseId: string;
    trainerId: string;
    value: string;
    unit: string;
    date: Date;
    weight?: number;
    repetitions?: number;
    duration?: number;
    distance?: number;
    notes?: string;
    variantValues?: string;
    sessionExerciseId?: string;
    seriesNumber?: number;
  }): Promise<PerformanceRecord> {
    const record = await prisma.performanceRecord.create({ data });
    return toPerformance(record);
  }

  async update(id: string, data: {
    value?: string;
    unit?: string;
    date?: Date;
    weight?: number | null;
    repetitions?: number | null;
    duration?: number | null;
    distance?: number | null;
    notes?: string | null;
    variantValues?: string | null;
  }): Promise<PerformanceRecord> {
    return toPerformance(await prisma.performanceRecord.update({ where: { id }, data }));
  }

  async delete(id: string): Promise<void> {
    await prisma.performanceRecord.delete({ where: { id } });
  }

  async findById(tenantId: string, id: string): Promise<PerformanceRecord | null> {
    const record = await prisma.performanceRecord.findFirst({ where: { tenantId, id } });
    return record ? toPerformance(record) : null;
  }

  async renumberSeries(sessionExerciseId: string): Promise<void> {
    const records = await prisma.performanceRecord.findMany({
      where: { sessionExerciseId },
      orderBy: [{ seriesNumber: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    await prisma.$transaction(records.map((record, index) =>
      prisma.performanceRecord.update({ where: { id: record.id }, data: { seriesNumber: index + 1 } }),
    ));
  }
}

const sessionDetailInclude = {
  client: true,
  trainer: { select: { name: true } },
  exercises: {
    orderBy: { position: 'asc' as const },
    include: {
      exercise: true,
      series: {
        orderBy: { seriesNumber: 'asc' as const },
        include: { trainer: { select: { name: true } } },
      },
    },
  },
} satisfies Prisma.TrainingSessionInclude;

type TrainingSessionDetailRecord = Prisma.TrainingSessionGetPayload<{
  include: typeof sessionDetailInclude;
}>;

export class PrismaTrainingSessionRepository implements TrainingSessionRepository {
  async findActiveByTrainer(tenantId: string, trainerId: string): Promise<TrainingSession | null> {
    const session = await prisma.trainingSession.findFirst({ where: { tenantId, trainerId, status: 'ACTIVE' } });
    return session ? toTrainingSession(session) : null;
  }

  async findById(tenantId: string, id: string): Promise<TrainingSession | null> {
    const session = await prisma.trainingSession.findFirst({ where: { tenantId, id } });
    return session ? toTrainingSession(session) : null;
  }

  async findDetail(tenantId: string, id: string): Promise<TrainingSessionDetail | null> {
    const session = await prisma.trainingSession.findFirst({ where: { tenantId, id }, include: sessionDetailInclude });
    return session ? toTrainingSessionDetail(session) : null;
  }

  async listByClient(tenantId: string, clientId: string): Promise<TrainingSessionDetail[]> {
    const sessions = await prisma.trainingSession.findMany({
      where: { tenantId, clientId, status: 'COMPLETED' },
      orderBy: { startedAt: 'desc' },
      include: sessionDetailInclude,
    });
    return sessions.map(toTrainingSessionDetail);
  }

  async listByTrainer(tenantId: string, trainerId: string, limit: number): Promise<TrainingSessionDetail[]> {
    const sessions = await prisma.trainingSession.findMany({
      where: { tenantId, trainerId, status: 'COMPLETED' },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: sessionDetailInclude,
    });
    return sessions.map(toTrainingSessionDetail);
  }

  async create(data: {
    tenantId: string;
    clientId: string;
    trainerId: string;
    startedAt: Date;
    routineTemplateId?: string;
    routinePlanId?: string;
    routinePlanPosition?: number;
  }): Promise<TrainingSession> {
    return toTrainingSession(await prisma.trainingSession.create({ data }));
  }

  async findPreviousSeries(
    tenantId: string,
    clientId: string,
    exerciseId: string,
    excludeSessionId?: string,
  ): Promise<PerformanceRecordWithTrainerName[]> {
    const previous = await prisma.trainingSessionExercise.findFirst({
      where: {
        exerciseId,
        series: { some: {} },
        session: {
          tenantId,
          clientId,
          status: 'COMPLETED',
          ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
        },
      },
      orderBy: { session: { startedAt: 'desc' } },
      include: {
        series: {
          orderBy: { seriesNumber: 'asc' },
          include: { trainer: { select: { name: true } } },
        },
      },
    });
    return previous ? previous.series.map(toPerformanceWithTrainerName) : [];
  }

  async complete(id: string, completedAt: Date, notes?: string): Promise<TrainingSession> {
    return toTrainingSession(await prisma.trainingSession.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt, notes: notes?.trim() || null },
    }));
  }

  async delete(id: string): Promise<void> {
    await prisma.trainingSession.delete({ where: { id } });
  }

  async addExercise(sessionId: string, exerciseId: string): Promise<TrainingSessionExercise> {
    const aggregate = await prisma.trainingSessionExercise.aggregate({ where: { sessionId }, _max: { position: true } });
    return prisma.trainingSessionExercise.create({
      data: { sessionId, exerciseId, position: (aggregate._max.position ?? 0) + 1 },
    });
  }

  async findExercise(sessionId: string, id: string): Promise<TrainingSessionExercise | null> {
    return prisma.trainingSessionExercise.findFirst({ where: { sessionId, id } });
  }

  async removeExercise(sessionId: string, id: string): Promise<void> {
    await prisma.trainingSessionExercise.delete({ where: { id, sessionId } });
  }
}

export class PrismaAuditLogRepository implements AuditLogRepository {
  async create(log: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: string;
  }): Promise<void> {
    await prisma.auditLog.create({ data: log });
  }
}

function toUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return { ...user, role: user.role as Role };
}

function toTenant(tenant: {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  appName: string;
  shortName: string;
  mark: string;
  claim: string;
  description: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  measurementsEnabled: boolean;
  active: boolean;
}): Tenant {
  return tenant;
}

function toMembership(membership: {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  canManageRoutines: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant?: (Tenant & { organization?: { id: string; name: string; slug: string; active: boolean } }) | null;
  user?: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}): Membership {
  return {
    id: membership.id,
    userId: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role as Role,
    canManageRoutines: membership.canManageRoutines,
    active: membership.active,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
    tenant: membership.tenant ? toTenant(membership.tenant) : undefined,
    user: membership.user ? toUser(membership.user) : undefined,
  };
}

function toClient(client: {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  height: number | null;
  weight: number | null;
  bodyFatPercentage: number | null;
  notes: string | null;
  goal: string | null;
  goalDate: Date | null;
  status: string;
  anonymizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Client {
  return { ...client, status: client.status as Status };
}

export function toExercise(exercise: {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  movementPattern: string;
  evaluationType: string;
  improvementDirection: string;
  defaultUnit: string;
  measurementFields: string;
  variantGroups: string;
  description: string | null;
  muscleGroup: string | null;
  libraryKey: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Exercise {
  return { ...exercise, status: exercise.status as Status };
}

function toPerformance(record: {
  id: string;
  tenantId: string;
  clientId: string;
  exerciseId: string;
  trainerId: string;
  value: string;
  unit: string;
  weight: number | null;
  repetitions: number | null;
  duration: number | null;
  distance: number | null;
  date: Date;
  notes: string | null;
  variantValues: string | null;
  sessionExerciseId: string | null;
  seriesNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}): PerformanceRecord {
  return record;
}

function toTrainingSession(session: {
  id: string;
  tenantId: string;
  clientId: string;
  trainerId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
  routineTemplateId: string | null;
  routinePlanId: string | null;
  routinePlanPosition: number | null;
  createdAt: Date;
  updatedAt: Date;
}): TrainingSession {
  return { ...session, status: session.status as TrainingSession['status'] };
}

function toTrainingSessionDetail(session: TrainingSessionDetailRecord): TrainingSessionDetail {
  return {
    ...toTrainingSession(session),
    client: toClient(session.client),
    trainerName: session.trainer.name,
    exercises: session.exercises.map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      exerciseId: item.exerciseId,
      position: item.position,
      createdAt: item.createdAt,
      exercise: toExercise(item.exercise),
      series: item.series.map(toPerformanceWithTrainerName),
    })),
  };
}

function toPerformanceWithTrainerName(record: Parameters<typeof toPerformance>[0] & { trainer: { name: string } }) {
  return {
    ...toPerformance(record),
    trainerName: record.trainer.name,
  };
}
