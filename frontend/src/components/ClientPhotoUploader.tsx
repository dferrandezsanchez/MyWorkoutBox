import { useState } from 'react';
import { useUploadClientPhoto, useDeleteClientPhoto } from '../hooks/useClients';

interface Props {
  clientId: string;
  onClose: () => void;
}

export default function ClientPhotoUploader({ clientId, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const upload = useUploadClientPhoto();
  const del = useDeleteClientPhoto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Selecciona una foto');
    if (!consent) return alert('Se requiere consentimiento para subir la foto');
    await upload.mutateAsync({ id: clientId, file, consentAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Subir foto de cliente" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-elevated border border-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Subir foto</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="client-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-text-secondary file:mr-3 file:min-h-[36px] file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <div className="flex items-start gap-2">
            <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <label htmlFor="consent" className="text-sm text-text-secondary">Confirmo que tengo el consentimiento del cliente para subir su foto</label>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={onClose} className="px-4 py-2 min-h-[44px] border border-border rounded-md">Cancelar</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => { if (confirm('¿Eliminar foto actual?')) { del.mutate(clientId); onClose(); } }} className="px-4 py-2 min-h-[44px] border border-border rounded-md">Eliminar foto</button>
              <button type="submit" className="px-4 py-2 min-h-[44px] bg-primary text-white rounded-md">Subir</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
