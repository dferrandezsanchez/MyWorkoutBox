import axios from 'axios';

type ApiClientConfig = {
  getToken?: () => string | null;
  onUnauthorized?: () => void;
};

let tokenProvider: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

export function configureApiClient(config: ApiClientConfig): void {
  tokenProvider = config.getToken ?? tokenProvider;
  unauthorizedHandler = config.onUnauthorized ?? unauthorizedHandler;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenProvider();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/select-tenant');

    if (error.response?.status === 401 && !isLoginRequest) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
