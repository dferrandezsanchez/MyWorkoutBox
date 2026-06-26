import apiClient from '@shared/api/http-client';
import type { CreateTrainerData, Trainer, UpdateTrainerData } from '@shared/types/api';

export async function listTrainers(includeInactive = true): Promise<Trainer[]> {
  const response = await apiClient.get<Trainer[]>('/trainers', {
    params: { includeInactive: String(includeInactive) },
  });
  return response.data;
}

export async function createTrainer(data: CreateTrainerData): Promise<Trainer> {
  const response = await apiClient.post<Trainer>('/trainers', data);
  return response.data;
}

export async function updateTrainer(id: string, data: UpdateTrainerData): Promise<Trainer> {
  const response = await apiClient.put<Trainer>(`/trainers/${id}`, data);
  return response.data;
}

export async function setTrainerActive(id: string, active: boolean): Promise<Trainer> {
  const response = await apiClient.patch<Trainer>(`/trainers/${id}/status`, { active });
  return response.data;
}

export async function resetTrainerPassword(id: string, password: string): Promise<void> {
  await apiClient.put(`/trainers/${id}/password`, { password });
}
