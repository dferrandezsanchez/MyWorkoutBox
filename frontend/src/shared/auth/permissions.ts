import type { AuthUser } from '@shared/types/auth';

/**
 * Whether the user can create/edit routine templates and client plans in the
 * current center. Admins always can; trainers need the explicit permission.
 * The JWT does not carry the flag, so pass the user from `/auth/me` or the
 * login response when available.
 */
export function canManageRoutines(user: Pick<AuthUser, 'role' | 'canManageRoutines'> | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || Boolean(user.canManageRoutines);
}
