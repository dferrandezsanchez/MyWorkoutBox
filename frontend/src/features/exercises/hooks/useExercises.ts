import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listExercises,
  getExercise,
  createExercise,
  updateExercise,
  setExerciseStatus,
  getExerciseLibrary,
  importExerciseLibrary,
} from '@features/exercises/api/exercises.api';
import type { CreateExerciseData, UpdateExerciseData } from '@shared/types/api';

export function useExercises(includeInactive?: boolean) {
  return useQuery({
    queryKey: ['exercises', { includeInactive }],
    queryFn: () => listExercises(includeInactive),
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExercise(id),
    enabled: !!id,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExerciseData) => createExercise(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseData }) =>
      updateExercise(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
      void queryClient.invalidateQueries({ queryKey: ['exercise', variables.id] });
    },
  });
}

export function useSetExerciseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      setExerciseStatus(id, status),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
      void queryClient.invalidateQueries({ queryKey: ['exercise', variables.id] });
    },
  });
}

export function useExerciseLibrary(enabled = true) {
  return useQuery({
    queryKey: ['exerciseLibrary'],
    queryFn: getExerciseLibrary,
    enabled,
    staleTime: 0,
  });
}

export function useImportExerciseLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => importExerciseLibrary(slugs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
      void queryClient.invalidateQueries({ queryKey: ['exerciseLibrary'] });
    },
  });
}
