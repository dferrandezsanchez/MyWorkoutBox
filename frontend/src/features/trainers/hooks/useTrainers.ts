import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTrainer,
  listTrainers,
  resetTrainerPassword,
  setTrainerActive,
  updateTrainer,
} from '@features/trainers/api/trainers.api';
import type { CreateTrainerData, UpdateTrainerData } from '@shared/types/api';

export function useTrainers(includeInactive = true) {
  return useQuery({
    queryKey: ['trainers', { includeInactive }],
    queryFn: () => listTrainers(includeInactive),
  });
}

export function useCreateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTrainerData) => createTrainer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
}

export function useUpdateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrainerData }) =>
      updateTrainer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
}

export function useSetTrainerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setTrainerActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
}

export function useResetTrainerPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetTrainerPassword(id, password),
  });
}
