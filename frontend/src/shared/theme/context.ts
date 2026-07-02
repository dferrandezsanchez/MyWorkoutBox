import { createContext } from 'react';
import type { TenantBrand } from '@shared/config/branding';

export interface ThemeContextValue {
  brand: TenantBrand;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
