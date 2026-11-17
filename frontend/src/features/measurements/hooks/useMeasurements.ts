import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMeasurement,
  deleteMeasurement,
  listMeasurements,
  updateMeasurement,
} from '@features/measurements/api/measurements.api';
import type { MeasurementInput } from '@shared/types/api';

export function useMeasurements(clientId: string, enabled = true) {
  return useQuery({
    queryKey: ['measurements', clientId],
    queryFn: () => listMeasurements(clientId),
    enabled: Boolean(clientId) && enabled,
  });
}

export function useSaveMeasurement(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: MeasurementInput }) =>
      id ? updateMeasurement(clientId, id, data) : createMeasurement(clientId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['measurements', clientId] });
    },
  });
}

export function useDeleteMeasurement(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMeasurement(clientId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['measurements', clientId] });
    },
  });
}
