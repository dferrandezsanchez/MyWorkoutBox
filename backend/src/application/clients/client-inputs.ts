import type { Status } from '../../domain/shared/enums';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  birthDate: Date | string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  status?: Status;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  birthDate?: Date | string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  status?: Status;
}

export function normalizeClientData<T extends CreateClientInput | UpdateClientInput>(data: T): T & { birthDate?: Date } {
  const normalized = { ...data } as T & { birthDate?: Date };
  if (data.birthDate) {
    normalized.birthDate =
      data.birthDate instanceof Date ? data.birthDate : new Date(`${data.birthDate}T00:00:00.000Z`);
  }
  return normalized;
}
