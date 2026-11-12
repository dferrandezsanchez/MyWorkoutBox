import { ReactNode, useEffect, useMemo, useState } from 'react';
import { getDocumentTitle } from '@shared/config/branding';
import { AUTH_CONTEXT_EVENT, getStoredTenant, getToken, setStoredTenant } from '@shared/auth/session-store';
import type { ActiveTenant } from '@shared/types/auth';
import { ActiveTenantContext } from './context';

interface ActiveTenantProviderProps {
  children: ReactNode;
  loadActiveTenant?: () => Promise<ActiveTenant>;
}

function readStoredTenant(): ActiveTenant | null {
  return getToken() ? getStoredTenant() : null;
}

export function ActiveTenantProvider({ children, loadActiveTenant }: ActiveTenantProviderProps) {
  const [tenant, setTenant] = useState<ActiveTenant | null>(readStoredTenant);

  useEffect(() => {
    const sync = () => setTenant(readStoredTenant());

    window.addEventListener(AUTH_CONTEXT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CONTEXT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (!getToken() || !loadActiveTenant) return;

      try {
        const remote = await loadActiveTenant();
        if (!cancelled) setStoredTenant(remote);
      } catch {
        // Keep the stored tenant; the HTTP client handles expired sessions.
      }
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [loadActiveTenant]);

  useEffect(() => {
    document.title = getDocumentTitle(tenant?.name);
  }, [tenant]);

  const value = useMemo(() => ({ tenant }), [tenant]);

  return <ActiveTenantContext.Provider value={value}>{children}</ActiveTenantContext.Provider>;
}
