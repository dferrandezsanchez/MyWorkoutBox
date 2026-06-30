import { useQuery } from '@tanstack/react-query';
import {
  getCurrentPerformances,
  getPerformanceHistory,
} from '@features/performances/api/performances.api';

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
