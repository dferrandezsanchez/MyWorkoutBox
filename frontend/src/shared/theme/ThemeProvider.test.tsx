import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { setStoredTenantBrand, setToken } from '@shared/auth/session-store';
import type { TenantBrand } from '@shared/config/branding';

const tenantBrand: TenantBrand = {
  id: 'tenant-1',
  organizationId: 'org-1',
  name: 'Tenant Brand',
  slug: 'tenant-brand',
  appName: 'Tenant App',
  shortName: 'Tenant',
  mark: 'TB',
  claim: 'Tenant claim',
  description: 'Tenant description',
  primary: '#112233',
  primaryHover: '#445566',
  primarySoft: '#778899',
};

function ThemeProbe() {
  const { brand, preference, resolvedTheme, setPreference, toggleTheme } = useTheme();
  return (
    <div>
      <span>{brand.name}</span>
      <span>{preference}</span>
      <span>{resolvedTheme}</span>
      <button type="button" onClick={() => setPreference('dark')}>Dark</button>
      <button type="button" onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('loads tenant brand when authenticated and writes CSS variables', async () => {
    setToken('token');
    const loadTenantBrand = vi.fn(async () => tenantBrand);

    render(
      <ThemeProvider loadTenantBrand={loadTenantBrand}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(await screen.findByText('Tenant Brand')).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('17 34 51'));
    expect(document.title).toBe('MyWorkoutBox · Tenant');
  });

  it('falls back to stored tenant brand if remote loading fails', async () => {
    setToken('token');
    setStoredTenantBrand(tenantBrand);

    render(
      <ThemeProvider loadTenantBrand={vi.fn(async () => {
        throw new Error('network');
      })}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(await screen.findByText('Tenant Brand')).toBeInTheDocument();
  });

  it('persists explicit preference and toggles resolved theme', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(localStorage.getItem('mwb_theme_preference')).toBe('dark');
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));

    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(localStorage.getItem('mwb_theme_preference')).toBe('light');
  });

});
