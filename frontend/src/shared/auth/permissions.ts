import type { AuthUser } from '@shared/types/auth';

export function canManageRoutines(user: Pick<AuthUser, 'role' | 'canManageRoutines'> | null | undefined): boolean {
  return Boolean(user && (user.role === 'ADMIN' || user.canManageRoutines));
}
