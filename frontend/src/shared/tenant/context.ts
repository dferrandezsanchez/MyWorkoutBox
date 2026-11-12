import { createContext } from 'react';
import type { ActiveTenant } from '@shared/types/auth';

export interface ActiveTenantContextValue {
  tenant: ActiveTenant | null;
}

export const ActiveTenantContext = createContext<ActiveTenantContextValue | null>(null);
