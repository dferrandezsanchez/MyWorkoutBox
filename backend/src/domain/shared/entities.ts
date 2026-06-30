import type {
  EvaluationType,
  ExerciseCategory,
  ImprovementDirection,
  MovementPattern,
  PerformanceUnit,
  Role,
  Status,
  TrainingSessionStatus,
} from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface Tenant {
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
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant & { organization?: Organization };
  user?: User;
}

export interface Client {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  height: number | null;
  weight: number | null;
  bodyFatPercentage: number | null;
  notes: string | null;
  status: Status;
  anonymizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  tenantId: string;
  name: string;
  category: ExerciseCategory | string;
  movementPattern: MovementPattern | string;
  evaluationType: EvaluationType | string;
  improvementDirection: ImprovementDirection | string;
  defaultUnit: PerformanceUnit | string;
  measurementFields: string;
  variantGroups: string;
  description: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceRecord {
  id: string;
  tenantId: string;
  clientId: string;
  exerciseId: string;
  trainerId: string;
  value: string;
  unit: PerformanceUnit | string;
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
}

export interface TrainingSession {
  id: string;
  tenantId: string;
  clientId: string;
  trainerId: string;
  status: TrainingSessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  position: number;
  createdAt: Date;
}

export interface TrainingSessionDetail extends TrainingSession {
  client: Client;
  trainerName: string;
  exercises: Array<TrainingSessionExercise & {
    exercise: Exercise;
    series: PerformanceRecordWithTrainerName[];
  }>;
}

export interface PerformanceRecordWithTrainerName extends PerformanceRecord {
  trainerName: string;
}

export interface AuditLog {
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: string;
}
