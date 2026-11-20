import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@features/routines/api/routines.api';
import type { ClientRoutinePlanInput, RoutineTemplateInput } from '@shared/types/api';

const routinesKey = ['routines'] as const;
const routineKey = (id: string) => ['routine', id];
const planKey = (clientId: string) => ['routine-plan', clientId];

export function useRoutines(includeInactive = false) {
  return useQuery({
    queryKey: [...routinesKey, { includeInactive }],
    queryFn: () => api.listRoutines(includeInactive),
  });
}

export function useRoutine(id: string) {
  return useQuery({
    queryKey: routineKey(id),
    queryFn: () => api.getRoutine(id),
    enabled: Boolean(id),
  });
}

export function useSaveRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: RoutineTemplateInput }) =>
      id ? api.updateRoutine(id, data) : api.createRoutine(data),
    onSuccess: (routine) => {
      queryClient.setQueryData(routineKey(routine.id), routine);
      void queryClient.invalidateQueries({ queryKey: routinesKey });
      // Plans embed their templates; refresh them so names and exercises stay in sync.
      void queryClient.invalidateQueries({ queryKey: ['routine-plan'] });
    },
  });
}

export function useSetRoutineStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => api.setRoutineStatus(id, status),
    onSuccess: (routine) => {
      queryClient.setQueryData(routineKey(routine.id), routine);
      void queryClient.invalidateQueries({ queryKey: routinesKey });
      void queryClient.invalidateQueries({ queryKey: ['routine-plan'] });
    },
  });
}

export function useClientRoutinePlan(clientId: string) {
  return useQuery({
    queryKey: planKey(clientId),
    queryFn: () => api.getClientRoutinePlan(clientId),
    enabled: Boolean(clientId),
  });
}

export function useClientRoutinePlanActions(clientId: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: planKey(clientId) });
    // Session start options (series prefill, next routine) depend on the plan.
    void queryClient.invalidateQueries({ queryKey: ['training-session', 'options', clientId] });
  };
  return {
    assign: useMutation({ mutationFn: (data: ClientRoutinePlanInput) => api.assignClientRoutinePlan(clientId, data), onSuccess }),
    setNext: useMutation({ mutationFn: (nextPosition: number) => api.setClientRoutinePlanNext(clientId, nextPosition), onSuccess }),
    remove: useMutation({ mutationFn: () => api.removeClientRoutinePlan(clientId), onSuccess }),
  };
}

/** Whether the current user can create/edit routines and client plans (ADMIN, or TRAINER with permission). */
export { useCanManageRoutines } from '@features/auth/hooks/useCanManageRoutines';
