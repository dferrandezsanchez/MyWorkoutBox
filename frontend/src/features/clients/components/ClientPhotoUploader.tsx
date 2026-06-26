import { useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import { useUploadClientPhoto, useDeleteClientPhoto } from '@features/clients/hooks/useClients';
import { Button } from '@shared/components/ui';

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-3 pb-0 backdrop-blur-sm sm:items-center sm:pb-3" role="dialog" aria-modal="true" aria-label="Subir foto de cliente" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border/70 bg-elevated/95 p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="min-w-0">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Camera size={22} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Foto del cliente</h2>
            <p className="mt-1 text-sm text-text-secondary">Sube una imagen solo si existe consentimiento.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-secondary hover:bg-surface hover:text-text-primary focus-ring" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="client-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-border/70 bg-surface/70 p-3 text-sm text-text-secondary file:mr-3 file:min-h-[38px] file:rounded-lg file:border-0 file:bg-primary file:px-3 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface/70 p-3">
            <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
            <label htmlFor="consent" className="text-sm text-text-secondary">Confirmo que tengo el consentimiento del cliente para subir su foto</label>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
            <Button type="button" onClick={() => { if (confirm('¿Eliminar foto actual?')) { del.mutate(clientId); onClose(); } }} variant="danger" className="inline-flex items-center justify-center gap-2">
              <Trash2 size={16} />
              Eliminar
            </Button>
            <Button type="submit" variant="primary">Subir</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
