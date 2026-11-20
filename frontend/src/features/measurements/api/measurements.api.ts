import apiClient from '@shared/api/http-client';
import type { ClientMeasurement, MeasurementInput } from '@shared/types/api';

export async function listMeasurements(clientId: string): Promise<ClientMeasurement[]> {
  const response = await apiClient.get<ClientMeasurement[]>(`/clients/${clientId}/measurements`);
  return response.data;
}

export async function createMeasurement(clientId: string, data: MeasurementInput): Promise<ClientMeasurement> {
  const response = await apiClient.post<ClientMeasurement>(`/clients/${clientId}/measurements`, data);
  return response.data;
}

export async function updateMeasurement(clientId: string, measurementId: string, data: MeasurementInput): Promise<ClientMeasurement> {
  const response = await apiClient.put<ClientMeasurement>(`/clients/${clientId}/measurements/${measurementId}`, data);
  return response.data;
}

export async function deleteMeasurement(clientId: string, measurementId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/measurements/${measurementId}`);
}
