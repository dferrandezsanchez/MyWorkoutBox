import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveTenantProvider } from './ActiveTenantProvider';
import { useActiveTenant } from './useActiveTenant';
import { getStoredTenant, setStoredTenant, setToken } from '@shared/auth/session-store';
import type { ActiveTenant } from '@shared/types/auth';

const tenant: ActiveTenant = {
  id: 'tenant-1',
  organizationId: 'org-1',
  name: 'TuMeta Personal Training',
  slug: 'tumeta',
};

function Probe() {
  const { tenant: active } = useActiveTenant();
  return <span>{active?.name ?? 'sin centro'}</span>;
}

describe('ActiveTenantProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.title = '';
    vi.restoreAllMocks();
  });

  it('shows only the platform name when there is no session', () => {
    render(
      <ActiveTenantProvider>
        <Probe />
      </ActiveTenantProvider>,
    );

    expect(screen.getByText('sin centro')).toBeInTheDocument();
    expect(document.title).toBe('STELIOS');
  });

  it('loads the active center and uses it as title context', async () => {
    setToken('token');
    const loadActiveTenant = vi.fn(async () => tenant);

    render(
      <ActiveTenantProvider loadActiveTenant={loadActiveTenant}>
        <Probe />
      </ActiveTenantProvider>,
    );

    expect(await screen.findByText('TuMeta Personal Training')).toBeInTheDocument();
    expect(getStoredTenant()).toEqual(tenant);
    expect(document.title).toBe('STELIOS · TuMeta Personal Training');
  });

  it('keeps the stored center if remote loading fails', async () => {
    setToken('token');
    setStoredTenant(tenant);

    render(
      <ActiveTenantProvider loadActiveTenant={vi.fn(async () => {
        throw new Error('network');
      })}>
        <Probe />
      </ActiveTenantProvider>,
    );

    expect(await screen.findByText('TuMeta Personal Training')).toBeInTheDocument();
  });
});
