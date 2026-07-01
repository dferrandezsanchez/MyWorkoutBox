import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePerformanceData, TrainingSession } from '@shared/types/api';
import * as api from '@features/training-sessions/api/training-sessions.api';

const sessionKey = (id: string) => ['training-session', id];

export function useActiveSession(enabled = true) {
  return useQuery({ queryKey: ['training-session', 'active'], queryFn: api.getActiveSession, enabled });
}

export function useTrainerSessions(limit = 10) {
  return useQuery({ queryKey: ['training-sessions', 'trainer', limit], queryFn: () => api.listTrainerSessions(limit) });
}

export function useTrainingSession(id: string) {
  return useQuery({ queryKey: sessionKey(id), queryFn: () => api.getSession(id), enabled: !!id });
}

export function useClientSessions(clientId: string) {
  return useQuery({ queryKey: ['training-sessions', 'client', clientId], queryFn: () => api.listClientSessions(clientId), enabled: !!clientId });
}

export function useStartSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.startSession,
    onSuccess: (session) => {
      client.setQueryData(sessionKey(session.id), session);
      client.setQueryData(['training-session', 'active'], session);
      void client.invalidateQueries({ queryKey: ['training-sessions', 'trainer'] });
    },
  });
}

export function useSessionActions(id: string) {
  const client = useQueryClient();
  const refresh = async () => {
    const session = client.getQueryData<TrainingSession>(sessionKey(id));
    await client.invalidateQueries({ queryKey: sessionKey(id) });
    await client.invalidateQueries({ queryKey: ['training-session', 'active'] });
    if (session) {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['training-sessions', 'client', session.clientId] }),
        client.invalidateQueries({ queryKey: ['currentPerformances', session.clientId] }),
        client.invalidateQueries({ queryKey: ['performanceHistory', session.clientId] }),
        client.invalidateQueries({ queryKey: ['training-sessions', 'trainer'] }),
      ]);
    }
  };
  return {
    addExercise: useMutation({ mutationFn: (exerciseId: string) => api.addSessionExercise(id, exerciseId), onSuccess: refresh }),
    removeExercise: useMutation({ mutationFn: (itemId: string) => api.removeSessionExercise(id, itemId), onSuccess: refresh }),
    createSeries: useMutation({ mutationFn: ({ itemId, data }: { itemId: string; data: CreatePerformanceData }) => api.createSessionSeries(id, itemId, data), onSuccess: refresh }),
    updateSeries: useMutation({ mutationFn: ({ recordId, data }: { recordId: string; data: CreatePerformanceData }) => api.updateSessionSeries(id, recordId, data), onSuccess: refresh }),
    deleteSeries: useMutation({ mutationFn: (recordId: string) => api.deleteSessionSeries(id, recordId), onSuccess: refresh }),
    complete: useMutation({ mutationFn: (notes?: string) => api.completeSession(id, notes), onSuccess: refresh }),
    discard: useMutation({ mutationFn: () => api.discardSession(id), onSuccess: refresh }),
  };
}
