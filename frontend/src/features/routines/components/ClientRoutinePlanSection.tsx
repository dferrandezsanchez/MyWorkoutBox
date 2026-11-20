import { useState } from 'react';
import { ArrowDown, ArrowUp, ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react';
import { useClientRoutinePlan, useClientRoutinePlanActions, useRoutines } from '@features/routines/hooks/useRoutines';
import { exerciseCountLabel, planLetter } from '@features/routines/utils/routine-labels';
import { Button, ConfirmDialog, Dialog, EmptyState, Panel, TextInput } from '@shared/components/ui';
import type { ClientRoutinePlan, ClientRoutinePlanInput, RoutineTemplate } from '@shared/types/api';

const MAX_PLAN_ROUTINES = 10;
const DEFAULT_PLAN_NAME = 'Serie de rutinas';

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}

interface ClientRoutinePlanSectionProps {
  clientId: string;
  /** Routine managers can assign, edit, change the next routine and remove the plan. */
  canManage: boolean;
  /** Optional link to the routines catalog. */
  onOpenRoutines?: () => void;
}

export function ClientRoutinePlanSection({ clientId, canManage, onOpenRoutines }: ClientRoutinePlanSectionProps) {
  const { data: plan, isLoading, isError } = useClientRoutinePlan(clientId);
  const actions = useClientRoutinePlanActions(clientId);
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNext = async (position: number) => {
    setError(null);
    try {
      await actions.setNext.mutateAsync(position);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cambiar la siguiente rutina'));
    }
  };

  const remove = async () => {
    setError(null);
    try {
      await actions.remove.mutateAsync();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo quitar la serie'));
    } finally {
      setConfirmRemove(false);
    }
  };

  let body;
  if (isLoading) {
    body = <p className="px-1 text-sm text-text-secondary">Cargando serie de rutinas...</p>;
  } else if (isError) {
    body = <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No se pudo cargar la serie de rutinas</p>;
  } else if (!plan) {
    body = (
      <div className="space-y-3">
        <EmptyState title="Sin serie de rutinas" description={canManage ? 'Asigna las rutinas que irá alternando (A → B → C).' : undefined} />
        {canManage && (
          <Button variant="primary" onClick={() => setEditing(true)} className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus size={17} />
            Asignar serie
          </Button>
        )}
      </div>
    );
  } else {
    body = <PlanSummary plan={plan} canManage={canManage} pending={actions.setNext.isPending} onSetNext={(position) => void setNext(position)} onEdit={() => setEditing(true)} onRemove={() => setConfirmRemove(true)} />;
  }

  return (
    <section aria-labelledby="routine-plan-title">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow flex items-center gap-2"><ListOrdered size={14} />Rutinas</p>
          <h2 id="routine-plan-title" className="mt-1.5 text-xl font-bold text-text-primary">Serie de rutinas</h2>
        </div>
        {onOpenRoutines && <Button variant="ghost" onClick={onOpenRoutines} className="px-3">Ver rutinas</Button>}
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {body}

      {editing && (
        <PlanEditorDialog
          plan={plan ?? null}
          onClose={() => setEditing(false)}
          onSave={async (data) => {
            await actions.assign.mutateAsync(data);
            setEditing(false);
          }}
        />
      )}

      {confirmRemove && (
        <ConfirmDialog
          title="¿Quitar la serie de rutinas?"
          description="El cliente dejará de tener una rutina sugerida para la próxima sesión. Las rutinas no se borran."
          confirmLabel="Quitar serie"
          pending={actions.remove.isPending}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => void remove()}
        />
      )}
    </section>
  );
}

function PlanSummary({ plan, canManage, pending, onSetNext, onEdit, onRemove }: {
  plan: ClientRoutinePlan;
  canManage: boolean;
  pending: boolean;
  onSetNext: (position: number) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const next = plan.items.find((item) => item.position === plan.nextPosition);
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {plan.name !== DEFAULT_PLAN_NAME && <p className="mb-0.5 truncate font-display text-base font-bold text-text-primary">{plan.name}</p>}
          {next && (
            <p className="truncate text-sm text-text-secondary">
              Siguiente: <span className="font-semibold text-primary-soft">{planLetter(next.position)} · {next.template.name}</span>
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={onEdit} aria-label="Editar serie" className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"><Pencil size={17} /></button>
            <button type="button" onClick={onRemove} aria-label="Quitar serie" className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-danger/10 hover:text-red-200 focus-ring"><Trash2 size={17} /></button>
          </div>
        )}
      </div>

      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Orden de la serie">
        {plan.items.map((item) => {
          const isNext = item.position === plan.nextPosition;
          const archived = item.template.status === 'INACTIVE';
          const chipClass = `inline-flex min-h-[40px] max-w-full items-center gap-2 rounded-full border px-3 text-sm font-semibold ${
            isNext ? 'border-primary bg-primary/15 text-text-primary' : 'border-white/[0.11] text-text-secondary'
          }`;
          const content = (
            <>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isNext ? 'bg-primary text-primary-contrast' : 'bg-white/[0.06] text-text-secondary'}`}>{planLetter(item.position)}</span>
              <span className="truncate">{item.template.name}</span>
              {archived && <span className="shrink-0 text-xs font-normal text-warning">archivada</span>}
              {isNext && <span className="sr-only">(siguiente)</span>}
            </>
          );
          return (
            <li key={item.id} className="max-w-full">
              {canManage && !isNext ? (
                <button type="button" disabled={pending} onClick={() => onSetNext(item.position)} aria-label={`Marcar ${planLetter(item.position)} · ${item.template.name} como siguiente`} className={`${chipClass} transition-colors hover:border-primary/50 hover:text-text-primary disabled:opacity-50 focus-ring`}>
                  {content}
                </button>
              ) : (
                <span className={chipClass} aria-current={isNext ? 'step' : undefined}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
      {canManage && plan.items.length > 1 && <p className="mt-3 text-xs text-text-muted">Toca una rutina para marcarla como la siguiente.</p>}
    </Panel>
  );
}

export function PlanEditorDialog({ plan, onClose, onSave }: {
  plan: ClientRoutinePlan | null;
  onClose: () => void;
  onSave: (data: ClientRoutinePlanInput) => Promise<void>;
}) {
  const { data: routines = [], isLoading } = useRoutines();
  const [name, setName] = useState(plan?.name ?? DEFAULT_PLAN_NAME);
  const [selected, setSelected] = useState<RoutineTemplate[]>(() => plan?.items.map((item) => item.template) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const move = (index: number, offset: -1 | 1) => {
    setSelected((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (selected.length === 0) {
      setError('Elige al menos una rutina');
      return;
    }
    if (selected.some((routine) => routine.status === 'INACTIVE')) {
      setError('Quita las rutinas archivadas para guardar');
      return;
    }
    const keepNext = plan && plan.nextPosition <= selected.length ? plan.nextPosition : 1;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim() || DEFAULT_PLAN_NAME, templateIds: selected.map((routine) => routine.id), nextPosition: keepNext });
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la serie'));
    } finally {
      setSaving(false);
    }
  };

  const full = selected.length >= MAX_PLAN_ROUTINES;

  return (
    <Dialog label={plan ? 'Editar serie de rutinas' : 'Asignar serie de rutinas'} onClose={onClose} className="max-w-lg">
      <h2 className="pr-10 text-xl font-bold text-text-primary">{plan ? 'Editar serie' : 'Asignar serie'}</h2>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-text-primary">Nombre</span>
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={191} className="w-full" />
      </label>

      <p className="eyebrow mb-2 mt-5 text-xs text-text-muted">Orden</p>
      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.12] px-4 py-4 text-center text-sm text-text-secondary">Añade rutinas en el orden en que se alternarán.</p>
      ) : (
        <ol className="space-y-2" aria-label="Rutinas de la serie">
          {selected.map((routine, index) => (
            <li key={`${routine.id}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-background/60 py-1.5 pl-2 pr-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-soft">{planLetter(index + 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text-primary">{routine.name}</span>
                {routine.status === 'INACTIVE' && <span className="text-xs text-warning">Archivada</span>}
              </span>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${planLetter(index + 1)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-white/[0.05] disabled:opacity-30 focus-ring"><ArrowUp size={16} /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1} aria-label={`Bajar ${planLetter(index + 1)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-white/[0.05] disabled:opacity-30 focus-ring"><ArrowDown size={16} /></button>
              <button type="button" onClick={() => setSelected((current) => current.filter((_, position) => position !== index))} aria-label={`Quitar ${planLetter(index + 1)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-danger/10 hover:text-red-200 focus-ring"><Trash2 size={16} /></button>
            </li>
          ))}
        </ol>
      )}

      <p className="eyebrow mb-1 mt-5 text-xs text-text-muted">Añadir rutina</p>
      {isLoading && <p className="text-sm text-text-secondary">Cargando rutinas...</p>}
      {!isLoading && routines.length === 0 && <p className="text-sm text-text-secondary">No hay rutinas activas. Crea una en Rutinas.</p>}
      <div className="divide-y divide-white/[0.06]">
        {routines.map((routine) => (
          <button
            key={routine.id}
            type="button"
            disabled={full}
            onClick={() => setSelected((current) => [...current, routine])}
            aria-label={`Añadir ${routine.name}`}
            className="group flex min-h-14 w-full items-center justify-between gap-3 py-2.5 text-left disabled:opacity-40 focus-ring"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold text-text-primary">{routine.name}</span>
              <span className="tabular text-xs text-text-muted">{exerciseCountLabel(routine.exercises.length)}</span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-contrast"><Plus size={17} /></span>
          </button>
        ))}
      </div>
      {full && <p className="mt-2 text-xs text-text-muted">Máximo {MAX_PLAN_ROUTINES} rutinas por serie.</p>}

      {error && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="button" variant="primary" onClick={() => void save()} disabled={saving}>{saving ? 'Guardando...' : 'Guardar serie'}</Button>
      </div>
    </Dialog>
  );
}
