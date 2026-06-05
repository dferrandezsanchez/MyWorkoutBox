import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listExercises,
  getExercise,
  createExercise,
  updateExercise,
  setExerciseStatus,
} from '../api/exercises';
import type { CreateExerciseData, UpdateExerciseData } from '../types/api';

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
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseData }) =>
      updateExercise(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercise', variables.id] });
    },
  });
}

export function useSetExerciseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      setExerciseStatus(id, status),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercise', variables.id] });
    },
  });
}
