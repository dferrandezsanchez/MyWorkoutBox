import apiClient from '@shared/api/http-client';
import type {
  ClientRoutinePlan,
  ClientRoutinePlanInput,
  RoutineTemplate,
  RoutineTemplateInput,
} from '@shared/types/api';

export async function listRoutines(includeInactive = false): Promise<RoutineTemplate[]> {
  const params = includeInactive ? { includeInactive: 'true' } : undefined;
  const response = await apiClient.get<RoutineTemplate[]>('/routines', { params });
  return response.data;
}

export async function getRoutine(id: string): Promise<RoutineTemplate> {
  const response = await apiClient.get<RoutineTemplate>(`/routines/${id}`);
  return response.data;
}

export async function createRoutine(data: RoutineTemplateInput): Promise<RoutineTemplate> {
  const response = await apiClient.post<RoutineTemplate>('/routines', data);
  return response.data;
}

export async function updateRoutine(id: string, data: RoutineTemplateInput): Promise<RoutineTemplate> {
  const response = await apiClient.put<RoutineTemplate>(`/routines/${id}`, data);
  return response.data;
}

export async function setRoutineStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<RoutineTemplate> {
  const response = await apiClient.patch<RoutineTemplate>(`/routines/${id}/status`, { status });
  return response.data;
}

export async function getClientRoutinePlan(clientId: string): Promise<ClientRoutinePlan | null> {
  const response = await apiClient.get<ClientRoutinePlan | null>(`/clients/${clientId}/routine-plan`);
  return response.data ?? null;
}

export async function assignClientRoutinePlan(clientId: string, data: ClientRoutinePlanInput): Promise<ClientRoutinePlan> {
  const response = await apiClient.put<ClientRoutinePlan>(`/clients/${clientId}/routine-plan`, data);
  return response.data;
}

export async function setClientRoutinePlanNext(clientId: string, nextPosition: number): Promise<ClientRoutinePlan> {
  const response = await apiClient.patch<ClientRoutinePlan>(`/clients/${clientId}/routine-plan/next`, { nextPosition });
  return response.data;
}

export async function removeClientRoutinePlan(clientId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/routine-plan`);
}
