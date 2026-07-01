import { createContext } from 'react';
import type { TenantBrand } from '@shared/config/branding';

interface ThemeContextValue {
  brand: TenantBrand;
  resolvedTheme: 'dark';
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
