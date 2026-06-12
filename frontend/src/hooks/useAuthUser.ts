import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, getMe, getCurrentTenant, updateCurrentTenant, updateMe } from '../api/auth';
import { AUTH_CONTEXT_EVENT, setStoredTenantBrand } from '../store/auth';

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
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
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
      queryClient.invalidateQueries({ queryKey: ['currentTenant'] });
    },
  });
}
