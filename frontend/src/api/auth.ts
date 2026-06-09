import apiClient from './axios';
import type { LoginResponse, AuthUser } from '../types/auth';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('/auth/me');
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
