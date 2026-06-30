import apiClient from '@shared/api/http-client';
import type { CurrentMark, PerformanceRecord } from '@shared/types/api';

export async function getCurrentPerformances(clientId: string): Promise<CurrentMark[]> {
  const response = await apiClient.get<CurrentMark[]>(
    `/clients/${clientId}/current-performances`
  );
  return response.data;
}

export async function getPerformanceHistory(
  clientId: string,
  exerciseId: string
): Promise<PerformanceRecord[]> {
  const response = await apiClient.get<PerformanceRecord[]>(
    `/clients/${clientId}/exercises/${exerciseId}/performances`
  );
  return response.data;
}
