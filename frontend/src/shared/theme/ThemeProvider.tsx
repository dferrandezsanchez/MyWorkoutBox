import { ReactNode, useEffect, useMemo, useState } from 'react';
import { getDocumentTitle, PLATFORM_BRAND, type TenantBrand } from '@shared/config/branding';
import { AUTH_CONTEXT_EVENT, getStoredTenantBrand, getToken, setStoredTenantBrand } from '@shared/auth/session-store';
import { ThemeContext } from './context';

interface ThemeProviderProps {
  children: ReactNode;
  loadTenantBrand?: () => Promise<TenantBrand>;
}

function hexToRgbTriplet(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `${r} ${g} ${b}`;
}

function getContrastTriplet(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
    .map((channel) => {
      const normalizedChannel = channel / 255;
      return normalizedChannel <= 0.03928
        ? normalizedChannel / 12.92
        : ((normalizedChannel + 0.055) / 1.055) ** 2.4;
    });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.45 ? '9 15 25' : '255 255 255';
}

export function ThemeProvider({ children, loadTenantBrand }: ThemeProviderProps) {
  const fallbackBrand = useMemo(() => PLATFORM_BRAND, []);
  const [brand, setBrand] = useState<TenantBrand>(() => (getToken() ? getStoredTenantBrand() : null) ?? fallbackBrand);

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
        const tenant = await loadTenantBrand?.();
        if (!tenant) {
          return;
        }
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
  }, [fallbackBrand, loadTenantBrand]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.style.setProperty('--color-primary', hexToRgbTriplet(brand.primary));
    root.style.setProperty('--color-primary-hover', hexToRgbTriplet(brand.primaryHover));
    root.style.setProperty('--color-primary-soft', hexToRgbTriplet(brand.primarySoft));
    root.style.setProperty('--color-primary-contrast', getContrastTriplet(brand.primary));
    document.title = getDocumentTitle(brand);
  }, [brand]);

  const value = useMemo(
    () => ({
      brand,
    }),
    [brand],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
