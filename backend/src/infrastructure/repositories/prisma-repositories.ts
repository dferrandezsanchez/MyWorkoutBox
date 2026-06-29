import type {
  AuditLogRepository,
  ClientRepository,
  CreateClientData,
  CreateExerciseData,
  ExerciseRepository,
  MembershipRepository,
  PerformanceRepository,
  TenantRepository,
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
  User,
} from '../../domain/shared/entities';
import { Role, Status } from '../../domain/shared/enums';
import prisma from '../prisma/prisma-client';

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
    await prisma.userTenantMembership.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { active },
    });
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
}

export class PrismaTenantRepository implements TenantRepository {
  async findActiveById(id: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findFirst({ where: { id, active: true } });
    return tenant ? toTenant(tenant) : null;
  }

  async updateBranding(
    tenantId: string,
    data: {
      name: string;
      appName: string;
      shortName: string;
      mark: string;
      claim: string;
      description: string;
      primary: string;
      primaryHover: string;
      primarySoft: string;
    },
  ): Promise<void> {
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
      orderBy: { date: 'desc' },
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
      orderBy: { date: 'desc' },
      include: { trainer: { select: { name: true } } },
    });
    return record ? toPerformanceWithTrainerName(record) : null;
  }

  async findByClient(tenantId: string, clientId: string): Promise<PerformanceRecord[]> {
    const records = await prisma.performanceRecord.findMany({ where: { tenantId, clientId } });
    return records.map(toPerformance);
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
  }): Promise<PerformanceRecord> {
    const record = await prisma.performanceRecord.create({ data });
    return toPerformance(record);
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
  active: boolean;
}): Tenant {
  return tenant;
}

function toMembership(membership: {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
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
  status: string;
  anonymizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Client {
  return { ...client, status: client.status as Status };
}

function toExercise(exercise: {
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
  createdAt: Date;
  updatedAt: Date;
}): PerformanceRecord {
  return record;
}

function toPerformanceWithTrainerName(record: Parameters<typeof toPerformance>[0] & { trainer: { name: string } }) {
  return {
    ...toPerformance(record),
    trainerName: record.trainer.name,
  };
}
