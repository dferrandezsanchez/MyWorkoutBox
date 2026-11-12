import apiClient from '@shared/api/http-client';
import type { DashboardOverview } from '@shared/types/api';

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await apiClient.get<DashboardOverview>('/dashboard/overview');
  return response.data;
}
