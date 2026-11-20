import apiClient from '@shared/api/http-client';
import type { CreatePerformanceData, PerformanceRecord, SessionStartOptions, StartSessionData, TrainingSession } from '@shared/types/api';

export async function getActiveSession(): Promise<TrainingSession | null> {
  return (await apiClient.get<TrainingSession | null>('/training-sessions/active')).data;
}

export async function listTrainerSessions(limit = 10): Promise<TrainingSession[]> {
  return (await apiClient.get<TrainingSession[]>('/training-sessions', { params: { limit } })).data;
}

/** Accepts a bare client id (free session) or the full start payload. */
export async function startSession(input: string | StartSessionData): Promise<TrainingSession> {
  const payload: StartSessionData = typeof input === 'string' ? { clientId: input } : input;
  return (await apiClient.post<TrainingSession>('/training-sessions', payload)).data;
}

export async function getSessionOptions(clientId: string): Promise<SessionStartOptions> {
  return (await apiClient.get<SessionStartOptions>(`/clients/${clientId}/session-options`)).data;
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
