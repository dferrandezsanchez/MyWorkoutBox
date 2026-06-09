import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, getMe, updateMe } from '../api/auth';

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
