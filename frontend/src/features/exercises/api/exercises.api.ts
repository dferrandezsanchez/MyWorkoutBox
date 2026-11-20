import apiClient from '@shared/api/http-client';
import type {
  CreateExerciseData,
  Exercise,
  ExerciseLibrary,
  ExerciseLibraryImportResult,
  UpdateExerciseData,
} from '@shared/types/api';

export async function listExercises(includeInactive?: boolean): Promise<Exercise[]> {
  const params = includeInactive ? { includeInactive: 'true' } : undefined;
  const response = await apiClient.get<Exercise[]>('/exercises', { params });
  return response.data;
}

export async function getExercise(id: string): Promise<Exercise> {
  const response = await apiClient.get<Exercise>(`/exercises/${id}`);
  return response.data;
}

export async function createExercise(data: CreateExerciseData): Promise<Exercise> {
  const response = await apiClient.post<Exercise>('/exercises', data);
  return response.data;
}

export async function updateExercise(id: string, data: UpdateExerciseData): Promise<Exercise> {
  const response = await apiClient.put<Exercise>(`/exercises/${id}`, data);
  return response.data;
}

export async function setExerciseStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<Exercise> {
  const response = await apiClient.patch<Exercise>(`/exercises/${id}/status`, { status });
  return response.data;
}

export async function getExerciseLibrary(): Promise<ExerciseLibrary> {
  const response = await apiClient.get<ExerciseLibrary>('/exercises/library');
  return response.data;
}

export async function importExerciseLibrary(slugs: string[]): Promise<ExerciseLibraryImportResult> {
  const response = await apiClient.post<ExerciseLibraryImportResult>('/exercises/library/import', { slugs });
  return response.data;
}
