import type { Role, Status } from './shared/enums';
import type {
  AuditLog,
  Client,
  Exercise,
  Membership,
  PerformanceRecord,
  PerformanceRecordWithTrainerName,
  Tenant,
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
}

export interface TenantRepository {
  findActiveById(id: string): Promise<Tenant | null>;
  updateBranding(tenantId: string, data: {
    name: string;
    appName: string;
    shortName: string;
    mark: string;
    claim: string;
    description: string;
    primary: string;
    primaryHover: string;
    primarySoft: string;
  }): Promise<void>;
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
  }): Promise<PerformanceRecord>;
}

export interface AuditLogRepository {
  create(log: AuditLog): Promise<void>;
}
