import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import { getAuthUser } from '@features/auth/model/auth-store';
import { canManageRoutines } from '@shared/auth/permissions';

/**
 * Routine permission of the signed-in user. Uses `/auth/me` (seeded at login)
 * because the JWT only carries the role; trainers resolve to false until the
 * user payload is available.
 */
export function useCanManageRoutines(): boolean {
  const { data } = useAuthUser();
  return canManageRoutines(data ?? getAuthUser());
}
