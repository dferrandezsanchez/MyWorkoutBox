import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentTenant } from '../api/auth';
import { getDocumentTitle, PLATFORM_BRAND, type TenantBrand } from '../config/branding';
import { AUTH_CONTEXT_EVENT, getStoredTenantBrand, getToken, setStoredTenantBrand } from '../store/auth';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  brand: TenantBrand;
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'mwb_theme_preference';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function hexToRgbTriplet(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `${r} ${g} ${b}`;
}

function getStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const fallbackBrand = useMemo(() => PLATFORM_BRAND, []);
  const [brand, setBrand] = useState<TenantBrand>(() => (getToken() ? getStoredTenantBrand() : null) ?? fallbackBrand);
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredPreference());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());
  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const syncBrand = () => {
      setBrand((getToken() ? getStoredTenantBrand() : null) ?? fallbackBrand);
    };

    window.addEventListener(AUTH_CONTEXT_EVENT, syncBrand);
    window.addEventListener('storage', syncBrand);
    return () => {
      window.removeEventListener(AUTH_CONTEXT_EVENT, syncBrand);
      window.removeEventListener('storage', syncBrand);
    };
  }, [fallbackBrand]);

  useEffect(() => {
    let cancelled = false;

    async function refreshTenantBrand() {
      if (!getToken()) {
        setBrand(fallbackBrand);
        return;
      }

      try {
        const tenant = await getCurrentTenant();
        if (!cancelled) {
          setStoredTenantBrand(tenant);
          setBrand(tenant);
        }
      } catch {
        if (!cancelled) {
          setBrand(getStoredTenantBrand() ?? fallbackBrand);
        }
      }
    }

    void refreshTenantBrand();

    return () => {
      cancelled = true;
    };
  }, [fallbackBrand]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.setProperty('--color-primary', hexToRgbTriplet(brand.primary));
    root.style.setProperty('--color-primary-hover', hexToRgbTriplet(brand.primaryHover));
    root.style.setProperty('--color-primary-soft', hexToRgbTriplet(brand.primarySoft));
    document.title = getDocumentTitle(brand);
  }, [brand, resolvedTheme]);

  const setPreference = (nextPreference: ThemePreference) => {
    localStorage.setItem(THEME_KEY, nextPreference);
    setPreferenceState(nextPreference);
  };

  const value = useMemo(
    () => ({
      brand,
      preference,
      resolvedTheme,
      setPreference,
      toggleTheme: () => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark'),
    }),
    [brand, preference, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
