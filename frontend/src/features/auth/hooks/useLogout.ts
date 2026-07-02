import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@features/auth/api/auth.api';
import { removeToken } from '@features/auth/model/auth-store';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const execute = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await logout();
    } catch {
      // A stateless logout must still clear an invalid or unreachable session locally.
    } finally {
      removeToken();
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  };

  return { execute, isPending };
}
