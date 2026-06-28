import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentPerformances,
  getPerformanceHistory,
  createPerformance,
} from '@features/performances/api/performances.api';
import type { CreatePerformanceData } from '@shared/types/api';

export function useCurrentPerformances(clientId: string) {
  return useQuery({
    queryKey: ['currentPerformances', clientId],
    queryFn: () => getCurrentPerformances(clientId),
    enabled: !!clientId,
  });
}

export function usePerformanceHistory(clientId: string, exerciseId: string) {
  return useQuery({
    queryKey: ['performanceHistory', clientId, exerciseId],
    queryFn: () => getPerformanceHistory(clientId, exerciseId),
    enabled: !!clientId && !!exerciseId,
  });
}

export function useCreatePerformance(clientId: string, exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePerformanceData) =>
      createPerformance(clientId, exerciseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['currentPerformances', clientId] });
      void queryClient.invalidateQueries({
        queryKey: ['performanceHistory', clientId, exerciseId],
      });
    },
  });
}
