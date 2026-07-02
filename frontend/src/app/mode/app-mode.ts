import type { Role } from '@shared/types/auth';

export type AppMode = 'admin' | 'trainer';

export function getAppMode(pathname: string): AppMode {
  return pathname.startsWith('/admin') || pathname.includes('mode=admin') ? 'admin' : 'trainer';
}

export function getAvailableModes(role: Role): AppMode[] {
  return role === 'ADMIN' ? ['admin', 'trainer'] : ['trainer'];
}

export function getModePath(mode: AppMode): '/admin' | '/trainer' {
  return mode === 'admin' ? '/admin' : '/trainer';
}
