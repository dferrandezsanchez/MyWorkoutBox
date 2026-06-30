import type { Role } from '@shared/types/auth';

// Re-export LoginResponse and AuthUser for convenience
export type { LoginResponse, AuthUser } from '@shared/types/auth';

// Performance units
export type PerformanceUnit =
  | 'kg'
  | 'repetitions'
  | 'seconds'
  | 'minutes'
  | 'meters'
  | 'calories'
  | 'text';

export type ExerciseCategory =
  | 'strength'
  | 'functional'
  | 'core'
  | 'endurance'
  | 'mobility'
  | 'technique';

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'core'
  | 'locomotion'
  | 'carry'
  | 'olympic'
  | 'gymnastic'
  | 'conditioning'
  | 'mobility'
  | 'general';

export type EvaluationType =
  | 'repetitions'
  | 'weight_reps'
  | 'max_time'
  | 'distance'
  | 'time_to_complete'
  | 'amrap'
  | 'rounds_reps'
  | 'qualitative';

export type ImprovementDirection = 'higher' | 'lower' | 'qualitative';

export interface MeasurementField {
  key: 'value' | 'weight' | 'repetitions' | 'duration' | 'distance';
  label: string;
  unit?: PerformanceUnit;
  required: boolean;
  primary?: boolean;
}

export interface VariantGroup {
  key: string;
  label: string;
  options: string[];
  required: boolean;
}

// Client
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;           // ISO 8601
  height?: number;             // cm
  weight?: number;             // kg
  bodyFatPercentage?: number;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  anonymizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Exercise
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory | string;
  movementPattern: MovementPattern | string;
  evaluationType: EvaluationType | string;
  improvementDirection: ImprovementDirection | string;
  defaultUnit: PerformanceUnit;
  measurementFields: string;
  variantGroups: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

// Trainer user managed by ADMIN
export interface Trainer {
  id: string;
  name: string;
  email: string;
  role: 'TRAINER';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Performance record (with trainerName resolved via JOIN)
export interface PerformanceRecord {
  id: string;
  clientId: string;
  exerciseId: string;
  trainerId: string;
  trainerName: string;
  value: number | string;
  unit: PerformanceUnit;
  weight?: number;
  repetitions?: number;
  duration?: number;
  distance?: number;
  date: string;               // ISO 8601
  notes?: string;
  variantValues?: string | null;
  sessionExerciseId?: string | null;
  seriesNumber?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Current mark per exercise (for client profile)
export interface CurrentMark {
  exerciseId: string;
  exerciseName: string;
  exercise: Exercise;
  record: PerformanceRecord | null;
  bestRecord: PerformanceRecord | null;
}

export interface TrainingSessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  position: number;
  createdAt: string;
  exercise: Exercise;
  series: PerformanceRecord[];
}

export interface TrainingSession {
  id: string;
  tenantId: string;
  clientId: string;
  trainerId: string;
  trainerName: string;
  status: 'ACTIVE' | 'COMPLETED';
  startedAt: string;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  client: Client;
  exercises: TrainingSessionExercise[];
}

// Export data for GDPR portability
export interface ClientExport {
  client: Client;
  performances: PerformanceRecord[];
  trainingSessions: TrainingSession[];
}

// ── Mutation input types ──────────────────────────────────────────────────────

export interface CreateClientData {
  firstName: string;
  lastName: string;
  birthDate: string;           // ISO 8601
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateClientData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateExerciseData {
  name: string;
  category: ExerciseCategory | string;
  movementPattern?: MovementPattern | string;
  evaluationType?: EvaluationType | string;
  improvementDirection?: ImprovementDirection | string;
  defaultUnit: PerformanceUnit;
  measurementFields?: MeasurementField[];
  variantGroups?: VariantGroup[];
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateExerciseData {
  name?: string;
  category?: ExerciseCategory | string;
  movementPattern?: MovementPattern | string;
  evaluationType?: EvaluationType | string;
  improvementDirection?: ImprovementDirection | string;
  defaultUnit?: PerformanceUnit;
  measurementFields?: MeasurementField[];
  variantGroups?: VariantGroup[];
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateTrainerData {
  name: string;
  email: string;
  password: string;
  active?: boolean;
}

export interface UpdateTrainerData {
  name?: string;
  email?: string;
  active?: boolean;
}

export interface CreatePerformanceData {
  value: number | string;
  unit: PerformanceUnit;
  date: string;               // ISO 8601
  weight?: number;
  repetitions?: number;
  duration?: number;
  distance?: number;
  notes?: string;
  variants?: Record<string, string>;
}

// User info returned by the API (includes role)
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
