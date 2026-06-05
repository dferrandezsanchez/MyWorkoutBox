import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient, useSetClientStatus, useUploadClientPhoto, useExportClient, useAnonymizeClient, useDeleteClientPhoto } from '../../hooks/useClients';
import ClientPhotoUploader from '../../components/ClientPhotoUploader';
import ClientCard from '../../components/ClientCard';
import ClientForm from '../../components/ClientForm';
import type { CreateClientData } from '../../types/api';

export default function ClientsAdminPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError } = useClients(undefined, true);
  const createMutation = useCreateClient();
  const statusMutation = useSetClientStatus();
  const uploadMutation = useUploadClientPhoto();
  const exportMutation = useExportClient();
  const anonymizeMutation = useAnonymizeClient();
  const deletePhotoMutation = useDeleteClientPhoto();

  const [showCreate, setShowCreate] = useState(false);
  const [uploadFor, setUploadFor] = useState<string | null>(null);

  if (isLoading) return <p className="text-text-secondary">Cargando clientes...</p>;
  if (isError) return <p className="text-red-500">Error al cargar clientes</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-text-primary">Administración — Clientes</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => navigate('/')}
              className="min-h-[44px] px-4 py-2 border border-border rounded-md text-text-primary hover:bg-background"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/exercises')}
              className="min-h-[44px] px-4 py-2 border border-border rounded-md text-text-primary hover:bg-background"
            >
              Ejercicios
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md"
            >
              Nuevo cliente
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clients?.map((c) => (
            <div key={c.id} className="bg-surface border border-border rounded-lg p-3">
              <ClientCard client={c} />
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => navigate(`/admin/clients/${c.id}`)}
                  className="min-h-[44px] px-2 py-1 bg-white border border-border rounded-md text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => statusMutation.mutate({ id: c.id, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  className="min-h-[44px] px-2 py-1 bg-white border border-border rounded-md text-sm"
                >
                  {c.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={async () => {
                    const exported = await exportMutation.mutateAsync(c.id);
                    const blob = new Blob([JSON.stringify(exported, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `cliente-${c.id}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="min-h-[44px] px-2 py-1 bg-white border border-border rounded-md text-sm"
                >
                  Exportar
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Anonimizar este cliente? Esta acción no se puede deshacer.')) {
                      anonymizeMutation.mutate(c.id);
                    }
                  }}
                  className="min-h-[44px] px-2 py-1 bg-white border border-border rounded-md text-sm"
                >
                  Anonimizar
                </button>
                <button
                  onClick={() => setUploadFor(c.id)}
                  className="min-h-[44px] px-2 py-1 bg-white border border-border rounded-md text-sm"
                >
                  Foto
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Crear cliente" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Crear cliente</h2>
              <ClientForm
                onSubmit={async (data) => {
                  await createMutation.mutateAsync(data as CreateClientData);
                  setShowCreate(false);
                }}
                submitLabel="Crear"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2">Cerrar</button>
              </div>
            </div>
          </div>
        )}
        {uploadFor && (
          <ClientPhotoUploader clientId={uploadFor} onClose={() => setUploadFor(null)} />
        )}
      </main>
    </div>
  );
}
