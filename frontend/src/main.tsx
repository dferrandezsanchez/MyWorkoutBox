import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from '@app/router/App';
import { getCurrentTenant } from '@features/auth/api/auth.api';
import { ThemeProvider } from '@shared/theme/ThemeProvider';
import { getToken, removeToken } from '@shared/auth/session-store';
import { configureApiClient } from '@shared/api/http-client';
import { queryClient } from '@shared/state/query-client';
import './index.css';

function buildLoginRedirect(reason: 'session-expired' | 'auth-required' = 'session-expired'): string {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ reason });

  if (currentPath && !currentPath.startsWith('/login')) {
    params.set('next', currentPath);
  }

  return `/login?${params.toString()}`;
}

configureApiClient({
  getToken,
  onUnauthorized: () => {
    removeToken();
    queryClient.clear();
    window.location.assign(buildLoginRedirect('session-expired'));
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider loadTenantBrand={getCurrentTenant}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
