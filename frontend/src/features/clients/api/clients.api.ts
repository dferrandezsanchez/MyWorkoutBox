import apiClient from '@shared/api/http-client';
import type { Client, ClientExport, CreateClientData, UpdateClientData } from '@shared/types/api';

export async function listClients(q?: string, includeInactive?: boolean): Promise<Client[]> {
  const params = {
    ...(q ? { q } : {}),
    ...(includeInactive ? { includeInactive: 'true' } : {}),
  };
  const response = await apiClient.get<Client[]>('/clients', { params });
  return response.data;
}

export async function getClient(id: string): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function createClient(data: CreateClientData): Promise<Client> {
  const response = await apiClient.post<Client>('/clients', data);
  return response.data;
}

export async function updateClient(id: string, data: UpdateClientData): Promise<Client> {
  const response = await apiClient.put<Client>(`/clients/${id}`, data);
  return response.data;
}

export async function setClientStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<Client> {
  const response = await apiClient.patch<Client>(`/clients/${id}/status`, { status });
  return response.data;
}

export async function exportClient(id: string): Promise<ClientExport> {
  const response = await apiClient.get<ClientExport>(`/clients/${id}/export`);
  return response.data;
}

export async function anonymizeClient(id: string): Promise<Client> {
  const response = await apiClient.post<Client>(`/clients/${id}/anonymize`);
  return response.data;
}
