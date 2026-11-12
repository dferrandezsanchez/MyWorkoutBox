import apiClient from '@shared/api/http-client';
import type { ActiveTenant, AuthUser, LoginResponse, LoginSuccessResponse } from '@shared/types/auth';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

export async function selectTenant(selectionToken: string, tenantId: string): Promise<LoginSuccessResponse> {
  const response = await apiClient.post<LoginSuccessResponse>('/auth/select-tenant', {
    selectionToken,
    tenantId,
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('/auth/me');
  return response.data;
}

export async function getCurrentTenant(): Promise<ActiveTenant> {
  const response = await apiClient.get<ActiveTenant>('/auth/tenant');
  return response.data;
}

export async function updateCurrentTenant(data: { name: string }): Promise<ActiveTenant> {
  const response = await apiClient.put<ActiveTenant>('/auth/tenant', data);
  return response.data;
}

export async function updateMe(data: { name: string; email: string }): Promise<AuthUser> {
  const response = await apiClient.put<AuthUser>('/auth/me', data);
  return response.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.put('/auth/me/password', data);
}
