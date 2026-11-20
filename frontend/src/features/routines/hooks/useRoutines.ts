import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as api from '@features/routines/api/routines.api';
import type { ClientRoutinePlanInput, RoutineProgramInput, RoutineTemplateInput } from '@shared/types/api';

const routinesKey = ['routines'] as const;
const routineKey = (id: string) => ['routine', id];
const planKey = (clientId: string) => ['routine-plan', clientId];
const programsKey = ['routine-programs'] as const;
const programKey = (id: string) => ['routine-program', id];
const programClientsKey = (id: string) => ['routine-program', id, 'clients'];

/** Plans and programs embed templates; plans that follow a program mirror its items. */
function invalidateDependents(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['routine-plan'] });
  void queryClient.invalidateQueries({ queryKey: ['training-session', 'options'] });
}

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
      // Plans and programs embed their templates; refresh them so names and exercises stay in sync.
      void queryClient.invalidateQueries({ queryKey: ['routine-plan'] });
      void queryClient.invalidateQueries({ queryKey: programsKey });
      void queryClient.invalidateQueries({ queryKey: ['routine-program'] });
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
      void queryClient.invalidateQueries({ queryKey: programsKey });
      void queryClient.invalidateQueries({ queryKey: ['routine-program'] });
    },
  });
}

export function useRoutinePrograms(includeInactive = false) {
  return useQuery({
    queryKey: [...programsKey, { includeInactive }],
    queryFn: () => api.listRoutinePrograms(includeInactive),
  });
}

export function useRoutineProgram(id: string) {
  return useQuery({
    queryKey: programKey(id),
    queryFn: () => api.getRoutineProgram(id),
    enabled: Boolean(id),
  });
}

export function useRoutineProgramClients(id: string) {
  return useQuery({
    queryKey: programClientsKey(id),
    queryFn: () => api.listRoutineProgramClients(id),
    enabled: Boolean(id),
  });
}

export function useSaveRoutineProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: RoutineProgramInput }) =>
      id ? api.updateRoutineProgram(id, data) : api.createRoutineProgram(data),
    onSuccess: (program) => {
      queryClient.setQueryData(programKey(program.id), program);
      void queryClient.invalidateQueries({ queryKey: programsKey });
      void queryClient.invalidateQueries({ queryKey: programClientsKey(program.id) });
      invalidateDependents(queryClient);
    },
  });
}

export function useSetRoutineProgramStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => api.setRoutineProgramStatus(id, status),
    onSuccess: (program) => {
      queryClient.setQueryData(programKey(program.id), program);
      void queryClient.invalidateQueries({ queryKey: programsKey });
      invalidateDependents(queryClient);
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
    // Program client counts and follower lists change when a plan joins or leaves a program.
    void queryClient.invalidateQueries({ queryKey: programsKey });
    void queryClient.invalidateQueries({ queryKey: ['routine-program'] });
  };
  return {
    assign: useMutation({ mutationFn: (data: ClientRoutinePlanInput) => api.assignClientRoutinePlan(clientId, data), onSuccess }),
    setNext: useMutation({ mutationFn: (nextPosition: number) => api.setClientRoutinePlanNext(clientId, nextPosition), onSuccess }),
    remove: useMutation({ mutationFn: () => api.removeClientRoutinePlan(clientId), onSuccess }),
  };
}

/** Whether the current user can create/edit routines and client plans (ADMIN, or TRAINER with permission). */
export { useCanManageRoutines } from '@features/auth/hooks/useCanManageRoutines';
