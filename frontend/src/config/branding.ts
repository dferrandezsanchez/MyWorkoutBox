import type { TenantBrand } from '../types/auth';

export type { TenantBrand };

export interface StaticTenantBrand {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  appName: string;
  shortName: string;
  mark: string;
  claim: string;
  description: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
}

export const TENANT_BRANDS: Record<string, TenantBrand> = {
  platform: {
    id: 'platform',
    organizationId: 'platform',
    name: 'MyWorkoutBox',
    slug: 'platform',
    appName: 'MyWorkoutBox',
    shortName: 'MWB',
    mark: 'MW',
    claim: 'Training Intelligence',
    description: 'Gestión de clientes, entrenadores, ejercicios y marcas.',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primarySoft: '#93C5FD',
  },
  tumeta: {
    id: 'tumeta',
    organizationId: 'org_tumeta',
    name: 'TuMeta Personal Training',
    slug: 'tumeta-personal-training',
    appName: 'tumeta',
    shortName: 'TuMeta',
    mark: 't',
    claim: 'Personal Training',
    description: 'Control de clientes, ejercicios y progresión.',
    primary: '#ED702D',
    primaryHover: '#D96424',
    primarySoft: '#F29A6A',
  },
};

export function getActiveTenantBrand(): TenantBrand {
  const tenantId = import.meta.env.VITE_TENANT_ID ?? 'platform';
  return TENANT_BRANDS[tenantId] ?? TENANT_BRANDS.platform;
}
