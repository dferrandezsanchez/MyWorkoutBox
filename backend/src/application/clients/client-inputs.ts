import type { Status } from '../../domain/shared/enums';
import type { MeasurementInput } from '../measurements/measurement-rules';
import { normalizeClientGoal } from './client-goal';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  birthDate: Date | string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  goal?: string | null;
  goalDate?: string | Date | null;
  status?: Status;
  /** Optional first measurement, stored as the first entry of the history. */
  initialMeasurement?: MeasurementInput | null;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  birthDate?: Date | string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  goal?: string | null;
  goalDate?: string | Date | null;
  status?: Status;
}

type NormalizedClientData<T> = Omit<T, 'birthDate' | 'goal' | 'goalDate' | 'initialMeasurement'> & {
  birthDate?: Date;
  goal?: string | null;
  goalDate?: Date | null;
};

export function normalizeClientData<T extends CreateClientInput | UpdateClientInput>(data: T): NormalizedClientData<T> {
  const normalized = { ...data } as Record<string, unknown>;
  delete normalized.initialMeasurement;
  delete normalized.goal;
  delete normalized.goalDate;
  if ('goal' in data || 'goalDate' in data) {
    Object.assign(normalized, normalizeClientGoal({ goal: data.goal, goalDate: data.goalDate }));
  }
  if (data.birthDate) {
    normalized.birthDate =
      data.birthDate instanceof Date ? data.birthDate : new Date(`${data.birthDate}T00:00:00.000Z`);
  }
  return normalized as NormalizedClientData<T>;
}
