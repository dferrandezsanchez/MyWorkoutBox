import type { Role } from './auth';

// Re-export LoginResponse and AuthUser for convenience
export type { LoginResponse, AuthUser } from './auth';

// Performance units
export type PerformanceUnit =
  | 'kg'
  | 'repetitions'
  | 'seconds'
  | 'minutes'
  | 'meters'
  | 'calories'
  | 'text';

// Client
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;           // ISO 8601
  height?: number;             // cm
  weight?: number;             // kg
  bodyFatPercentage?: number;
  photoUrl?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  anonymizedAt?: string | null;
  photoConsentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Exercise
export interface Exercise {
  id: string;
  name: string;
  category: string;
  defaultUnit: PerformanceUnit;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
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
  createdAt: string;
  updatedAt: string;
}

// Current mark per exercise (for client profile)
export interface CurrentMark {
  exerciseId: string;
  exerciseName: string;
  record: PerformanceRecord | null;
}

// Export data for GDPR portability
export interface ClientExport {
  client: Client;
  performances: PerformanceRecord[];
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
  category: string;
  defaultUnit: PerformanceUnit;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateExerciseData {
  name?: string;
  category?: string;
  defaultUnit?: PerformanceUnit;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
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
}

// User info returned by the API (includes role)
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
