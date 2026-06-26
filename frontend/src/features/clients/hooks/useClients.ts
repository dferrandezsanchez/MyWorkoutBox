import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  setClientStatus,
  uploadClientPhoto,
  exportClient,
  anonymizeClient,
  deleteClientPhoto,
} from '@features/clients/api/clients.api';
import type { CreateClientData, UpdateClientData } from '@shared/types/api';

export function useClients(q?: string, includeInactive?: boolean) {
  return useQuery({
    queryKey: ['clients', q, { includeInactive }],
    queryFn: () => listClients(q, includeInactive),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientData) => createClient(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) =>
      updateClient(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useSetClientStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      setClientStatus(id, status),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useUploadClientPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      consentAt,
    }: {
      id: string;
      file: File;
      consentAt: string;
    }) => uploadClientPhoto(id, file, consentAt),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useExportClient() {
  return useMutation({
    mutationFn: (id: string) => exportClient(id),
  });
}

export function useAnonymizeClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anonymizeClient(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
  });
}

export function useDeleteClientPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClientPhoto(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
  });
}
