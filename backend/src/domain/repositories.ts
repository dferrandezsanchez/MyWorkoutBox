import type { Role, Status } from './shared/enums';
import type {
  ClientMeasurement,
  ClientRoutinePlan,
  AuditLog,
  Client,
  Exercise,
  Membership,
  PerformanceRecord,
  PerformanceRecordWithTrainerName,
  RoutineTemplate,
  Tenant,
  TrainingSession,
  TrainingSessionDetail,
  TrainingSessionExercise,
  User,
} from './shared/entities';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  createTrainer(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    active: boolean;
  }): Promise<User>;
  upsertTrainer(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    active: boolean;
  }): Promise<User>;
  update(id: string, data: { name?: string; email?: string; active?: boolean; passwordHash?: string }): Promise<User>;
}

export interface MembershipRepository {
  findActiveByUser(userId: string): Promise<Membership[]>;
  findActiveByUserAndTenant(userId: string, tenantId: string): Promise<Membership | null>;
  findByUserAndTenant(userId: string, tenantId: string): Promise<Membership | null>;
  upsert(input: { userId: string; tenantId: string; role: Role; active: boolean }): Promise<Membership>;
  updateActive(userId: string, tenantId: string, active: boolean): Promise<void>;
  findTrainers(tenantId: string, includeInactive: boolean): Promise<Membership[]>;
  /** All staff of a tenant (ADMIN and TRAINER memberships) with their user. */
  findStaff(tenantId: string, includeInactive: boolean): Promise<Membership[]>;
  updateAccess(userId: string, tenantId: string, data: { role?: Role; canManageRoutines?: boolean }): Promise<Membership>;
  /** Active ADMIN memberships whose user is also active. */
  countActiveAdmins(tenantId: string): Promise<number>;
}

export interface TenantRepository {
  findActiveById(id: string): Promise<Tenant | null>;
  updateSettings(tenantId: string, data: { name?: string; measurementsEnabled?: boolean }): Promise<void>;
}

export interface ClientRepository {
  list(tenantId: string, options: { query?: string; includeInactive: boolean }): Promise<Client[]>;
  findById(tenantId: string, id: string): Promise<Client | null>;
  create(tenantId: string, data: CreateClientData): Promise<Client>;
  update(tenantId: string, id: string, data: UpdateClientData): Promise<Client>;
}

export type CreateClientData = {
  firstName: string;
  lastName: string;
  birthDate: Date;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  goal?: string | null;
  goalDate?: Date | null;
  status?: Status;
};

export type UpdateClientData = Partial<Omit<CreateClientData, 'notes'>> & {
  notes?: string | null;
  anonymizedAt?: Date;
};

export interface ExerciseRepository {
  list(tenantId: string, includeInactive: boolean): Promise<Exercise[]>;
  findById(tenantId: string, id: string): Promise<Exercise | null>;
  create(tenantId: string, data: CreateExerciseData): Promise<Exercise>;
  /** Creates several exercises at once and returns how many were created. */
  createMany(tenantId: string, data: CreateExerciseData[]): Promise<number>;
  update(tenantId: string, id: string, data: UpdateExerciseData): Promise<Exercise>;
}

export type CreateExerciseData = {
  name: string;
  category: string;
  movementPattern: string;
  evaluationType: string;
  improvementDirection: string;
  defaultUnit: string;
  measurementFields: string;
  variantGroups: string;
  description?: string;
  muscleGroup?: string | null;
  libraryKey?: string | null;
  status?: Status;
};

export type UpdateExerciseData = Partial<CreateExerciseData>;

export interface PerformanceRepository {
  findByClientAndExercise(
    tenantId: string,
    clientId: string,
    exerciseId: string,
  ): Promise<PerformanceRecordWithTrainerName[]>;
  findLatestByClientExercise(
    tenantId: string,
    clientId: string,
    exerciseId: string,
  ): Promise<PerformanceRecordWithTrainerName | null>;
  findByClient(tenantId: string, clientId: string): Promise<PerformanceRecord[]>;
  findByClientWithTrainer(tenantId: string, clientId: string): Promise<PerformanceRecordWithTrainerName[]>;
  create(data: {
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
  }): Promise<PerformanceRecord>;
  update(id: string, data: {
    value?: string;
    unit?: string;
    date?: Date;
    weight?: number | null;
    repetitions?: number | null;
    duration?: number | null;
    distance?: number | null;
    notes?: string | null;
    variantValues?: string | null;
  }): Promise<PerformanceRecord>;
  delete(id: string): Promise<void>;
  findById(tenantId: string, id: string): Promise<PerformanceRecord | null>;
  renumberSeries(sessionExerciseId: string): Promise<void>;
}

export interface TrainingSessionRepository {
  findActiveByTrainer(tenantId: string, trainerId: string): Promise<TrainingSession | null>;
  findById(tenantId: string, id: string): Promise<TrainingSession | null>;
  findDetail(tenantId: string, id: string): Promise<TrainingSessionDetail | null>;
  listByClient(tenantId: string, clientId: string): Promise<TrainingSessionDetail[]>;
  listByTrainer(tenantId: string, trainerId: string, limit: number): Promise<TrainingSessionDetail[]>;
  create(data: {
    tenantId: string;
    clientId: string;
    trainerId: string;
    startedAt: Date;
    routineTemplateId?: string;
    routinePlanId?: string;
    routinePlanPosition?: number;
  }): Promise<TrainingSession>;
  /**
   * Series recorded for `exerciseId` in the client's most recent COMPLETED session
   * that included that exercise (excluding `excludeSessionId`), ordered by series number.
   */
  findPreviousSeries(
    tenantId: string,
    clientId: string,
    exerciseId: string,
    excludeSessionId?: string,
  ): Promise<PerformanceRecordWithTrainerName[]>;
  complete(id: string, completedAt: Date, notes?: string): Promise<TrainingSession>;
  delete(id: string): Promise<void>;
  addExercise(sessionId: string, exerciseId: string): Promise<TrainingSessionExercise>;
  findExercise(sessionId: string, id: string): Promise<TrainingSessionExercise | null>;
  removeExercise(sessionId: string, id: string): Promise<void>;
}

export type RoutineTemplateExerciseInput = {
  exerciseId: string;
  targetSets?: number | null;
  targetReps?: string | null;
  notes?: string | null;
};

export interface RoutineTemplateRepository {
  list(tenantId: string, includeInactive: boolean): Promise<RoutineTemplate[]>;
  findById(tenantId: string, id: string): Promise<RoutineTemplate | null>;
  create(data: {
    tenantId: string;
    name: string;
    notes?: string | null;
    createdById: string;
    exercises: RoutineTemplateExerciseInput[];
  }): Promise<RoutineTemplate>;
  /** Updates fields; when `exercises` is given, replaces the whole ordered list (positions 1..n). */
  update(tenantId: string, id: string, data: {
    name?: string;
    notes?: string | null;
    status?: Status;
    exercises?: RoutineTemplateExerciseInput[];
  }): Promise<RoutineTemplate>;
}

export interface ClientRoutinePlanRepository {
  /** The client's active plan with items (ordered) and their templates + exercises. */
  findActiveByClient(tenantId: string, clientId: string): Promise<ClientRoutinePlan | null>;
  findById(tenantId: string, id: string): Promise<ClientRoutinePlan | null>;
  /** Deactivates any existing active plan of the client and creates a new one (positions 1..n). */
  replaceActive(data: {
    tenantId: string;
    clientId: string;
    name: string;
    createdById: string;
    templateIds: string[];
    nextPosition?: number;
  }): Promise<ClientRoutinePlan>;
  deactivate(tenantId: string, id: string): Promise<void>;
  setNextPosition(tenantId: string, id: string, nextPosition: number): Promise<void>;
}

export interface AuditLogRepository {
  create(log: AuditLog): Promise<void>;
}

/** Read model for the admin dashboard: one row per training session. */
export interface DashboardSessionRow {
  id: string;
  clientId: string;
  clientName: string;
  trainerId: string;
  trainerName: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  exerciseCount: number;
  seriesCount: number;
}

export interface DashboardClientRow {
  id: string;
  name: string;
  lastSessionAt: Date | null;
}

export interface DashboardRepository {
  /** Sessions started on or after `since`, plus any session still active. */
  listSessionsSince(tenantId: string, since: Date): Promise<DashboardSessionRow[]>;
  /** Active clients with the start date of their latest training session. */
  listActiveClientsWithLastSession(tenantId: string): Promise<DashboardClientRow[]>;
}

export interface ProvisionCenterUser {
  name: string;
  email: string;
  passwordHash: string;
}

export interface ProvisionCenterData {
  organization: { name: string; slug: string };
  tenant: { name: string; slug: string };
  admin: ProvisionCenterUser;
  trainers: ProvisionCenterUser[];
  exercises: CreateExerciseData[];
}

export interface ProvisionedCenter {
  organizationId: string;
  tenantId: string;
  adminUserId: string;
  /** False when the email already belonged to a user: they keep their password and gain access to the new center. */
  adminCreated: boolean;
  /** One entry per requested trainer, in the same order. `created` is false for emails that already had an account. */
  trainers: Array<{ email: string; created: boolean }>;
  exercisesCreated: number;
}

export interface CenterRepository {
  findOrganizationBySlug(slug: string): Promise<{ id: string; tenantId: string | null } | null>;
  /** Creates the organization, center, admin access and starter exercises atomically. */
  provision(data: ProvisionCenterData): Promise<ProvisionedCenter>;
}

export type MeasurementValues = {
  measuredAt: Date;
  weight: number | null;
  bodyFatPercentage: number | null;
  muscleMass: number | null;
  notes: string | null;
};

export interface MeasurementRepository {
  listByClient(tenantId: string, clientId: string): Promise<ClientMeasurement[]>;
  findById(tenantId: string, id: string): Promise<ClientMeasurement | null>;
  create(data: MeasurementValues & { tenantId: string; clientId: string; createdById: string }): Promise<ClientMeasurement>;
  update(id: string, data: MeasurementValues): Promise<ClientMeasurement>;
  delete(id: string): Promise<void>;
  deleteByClient(tenantId: string, clientId: string): Promise<void>;
}
