import axios from 'axios';
import { getToken, removeToken } from '../store/auth';
import { queryClient } from '../queryClient';

function buildLoginRedirect(reason: 'session-expired' | 'auth-required' = 'session-expired'): string {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ reason });

  if (currentPath && !currentPath.startsWith('/login')) {
    params.set('next', currentPath);
  }

  return `/login?${params.toString()}`;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT when available
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — on 401 clear token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/select-tenant');

    if (error.response?.status === 401 && !isLoginRequest) {
      removeToken();
      queryClient.clear();
      window.location.assign(buildLoginRedirect('session-expired'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
