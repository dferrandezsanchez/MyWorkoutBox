import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { CalendarClock, Pencil, Plus, Target } from 'lucide-react';
import { Button, Dialog, Panel } from '@shared/components/ui';
import type { Client } from '@shared/types/api';
import { useUpdateClientGoal } from '@features/clients/hooks/useClients';
import { describeTimeLeft } from '@features/clients/utils/goal';

function formatGoalDate(value: string): string {
  return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}


const inputClass =
  'min-h-[48px] w-full rounded-xl border border-border bg-background/60 px-3.5 py-2 text-base text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';

export function ClientGoalCard({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const hasGoal = Boolean(client.goal || client.goalDate);

  if (!hasGoal) {
    return (
      <>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-dashed border-white/[0.14] bg-surface/60 px-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.04] focus-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
            <Plus size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-text-primary">Añadir objetivo</span>
            <span className="block text-xs text-text-muted">Motivo, meta y fecha (una carrera, una boda, salud…)</span>
          </span>
        </button>
        {editing && <GoalDialog client={client} onClose={() => setEditing(false)} />}
      </>
    );
  }

  return (
    <>
      <Panel className="relative overflow-hidden p-4 sm:p-5">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-warning/70" />
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-warning/25 bg-warning/10 text-warning">
            <Target size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-warning">Objetivo</p>
            {client.goal && <p className="mt-1 text-base font-semibold leading-snug text-text-primary">{client.goal}</p>}
            {client.goalDate && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
                <CalendarClock size={14} className="text-text-muted" aria-hidden="true" />
                <span>{formatGoalDate(client.goalDate)}</span>
                <span className="tabular rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                  {describeTimeLeft(client.goalDate)}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar objetivo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"
          >
            <Pencil size={16} />
          </button>
        </div>
      </Panel>
      {editing && <GoalDialog client={client} onClose={() => setEditing(false)} />}
    </>
  );
}

function GoalDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const mutation = useUpdateClientGoal(client.id);
  const [goal, setGoal] = useState(client.goal ?? '');
  const [goalDate, setGoalDate] = useState(client.goalDate?.slice(0, 10) ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = async (data: { goal: string | null; goalDate: string | null }) => {
    setError(null);
    try {
      await mutation.mutateAsync(data);
      onClose();
    } catch (saveError) {
      const message = axios.isAxiosError(saveError) ? (saveError.response?.data as { error?: string } | undefined)?.error : undefined;
      setError(message ?? 'No se pudo guardar el objetivo.');
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void save({ goal: goal.trim() || null, goalDate: goalDate || null });
  };

  return (
    <Dialog label="Objetivo del cliente" onClose={onClose} className="max-w-md">
      <p className="eyebrow mb-1">{client.firstName} {client.lastName}</p>
      <h2 className="pr-10 text-xl font-bold text-text-primary">Objetivo</h2>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="goal" className="mb-1.5 block text-sm font-medium text-text-secondary">Motivo y meta</label>
          <textarea
            id="goal"
            rows={3}
            maxLength={500}
            placeholder="Ej.: preparar la media maratón de Valencia"
            className={`${inputClass} resize-none py-2.5`}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="goalDate" className="mb-1.5 block text-sm font-medium text-text-secondary">Fecha objetivo <span className="text-text-muted">(opcional)</span></label>
          <input id="goalDate" type="date" className={inputClass} value={goalDate} onChange={(event) => setGoalDate(event.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          {(client.goal || client.goalDate) ? (
            <Button type="button" variant="ghost" className="text-red-300" disabled={mutation.isPending} onClick={() => void save({ goal: null, goalDate: null })}>
              Quitar objetivo
            </Button>
          ) : <span />}
          <Button type="submit" variant="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
