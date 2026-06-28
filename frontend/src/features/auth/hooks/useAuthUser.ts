import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, getMe, getCurrentTenant, updateCurrentTenant, updateMe } from '@features/auth/api/auth.api';
import { AUTH_CONTEXT_EVENT, setStoredTenantBrand } from '@features/auth/model/auth-store';

export function useAuthUser() {
  return useQuery({
    queryKey: ['authUser'],
    queryFn: getMe,
  });
}

export function useUpdateAuthUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useCurrentTenant() {
  return useQuery({
    queryKey: ['currentTenant'],
    queryFn: getCurrentTenant,
  });
}

export function useUpdateCurrentTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentTenant,
    onSuccess: (tenant) => {
      setStoredTenantBrand(tenant);
      window.dispatchEvent(new Event(AUTH_CONTEXT_EVENT));
      queryClient.setQueryData(['currentTenant'], tenant);
      void queryClient.invalidateQueries({ queryKey: ['currentTenant'] });
    },
  });
}
