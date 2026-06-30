import apiClient from '@shared/api/http-client';
import type { CreatePerformanceData, PerformanceRecord, TrainingSession } from '@shared/types/api';

export async function getActiveSession(): Promise<TrainingSession | null> {
  return (await apiClient.get<TrainingSession | null>('/training-sessions/active')).data;
}

export async function startSession(clientId: string): Promise<TrainingSession> {
  return (await apiClient.post<TrainingSession>('/training-sessions', { clientId })).data;
}

export async function getSession(id: string): Promise<TrainingSession> {
  return (await apiClient.get<TrainingSession>(`/training-sessions/${id}`)).data;
}

export async function listClientSessions(clientId: string): Promise<TrainingSession[]> {
  return (await apiClient.get<TrainingSession[]>(`/clients/${clientId}/training-sessions`)).data;
}

export async function addSessionExercise(id: string, exerciseId: string): Promise<TrainingSession> {
  return (await apiClient.post<TrainingSession>(`/training-sessions/${id}/exercises`, { exerciseId })).data;
}

export async function removeSessionExercise(id: string, itemId: string): Promise<TrainingSession> {
  return (await apiClient.delete<TrainingSession>(`/training-sessions/${id}/exercises/${itemId}`)).data;
}

export async function createSessionSeries(id: string, itemId: string, data: CreatePerformanceData): Promise<PerformanceRecord> {
  return (await apiClient.post<PerformanceRecord>(`/training-sessions/${id}/exercises/${itemId}/series`, data)).data;
}

export async function updateSessionSeries(id: string, recordId: string, data: CreatePerformanceData): Promise<PerformanceRecord> {
  return (await apiClient.put<PerformanceRecord>(`/training-sessions/${id}/series/${recordId}`, data)).data;
}

export async function deleteSessionSeries(id: string, recordId: string): Promise<void> {
  await apiClient.delete(`/training-sessions/${id}/series/${recordId}`);
}

export async function completeSession(id: string, notes?: string): Promise<TrainingSession> {
  return (await apiClient.post<TrainingSession>(`/training-sessions/${id}/complete`, { notes })).data;
}

export async function discardSession(id: string): Promise<void> {
  await apiClient.delete(`/training-sessions/${id}`);
}
