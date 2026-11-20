import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react';
import { RoutineSequenceChips } from '@features/routines/components/RoutineSequenceChips';
import { RoutineSequenceEditor } from '@features/routines/components/RoutineSequenceEditor';
import { useClientRoutinePlan, useClientRoutinePlanActions, useRoutinePrograms, useRoutines } from '@features/routines/hooks/useRoutines';
import { planLetter, sortedProgramItems } from '@features/routines/utils/routine-labels';
import { Button, ConfirmDialog, Dialog, EmptyState, Panel, TextInput } from '@shared/components/ui';
import type { ClientRoutinePlan, ClientRoutinePlanInput, RoutineProgram, RoutineTemplate } from '@shared/types/api';

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
  const followsProgram = Boolean(plan?.programId && plan.program);

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
        <EmptyState title="Sin serie de rutinas" description={canManage ? 'Asigna un programa o las rutinas que irá alternando (A → B → C).' : undefined} />
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
          title={followsProgram ? '¿Dejar de seguir el programa?' : '¿Quitar la serie de rutinas?'}
          description={followsProgram
            ? 'El cliente dejará de tener una rutina sugerida para la próxima sesión. El programa no cambia.'
            : 'El cliente dejará de tener una rutina sugerida para la próxima sesión. Las rutinas no se borran.'}
          confirmLabel={followsProgram ? 'Quitar programa' : 'Quitar serie'}
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
  const location = useLocation();
  const modeQuery = location.search.includes('mode=admin') ? '?mode=admin' : '';
  const next = plan.items.find((item) => item.position === plan.nextPosition);
  const program = plan.programId ? plan.program : null;

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {program ? (
            <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Layers size={15} aria-hidden="true" className="shrink-0 text-primary-soft" />
              <Link to={`/routines/programs/${program.id}${modeQuery}`} className="truncate font-display text-base font-bold text-text-primary underline-offset-4 hover:text-primary-soft hover:underline focus-ring">
                {program.name}
              </Link>
              {program.status === 'INACTIVE' && <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-text-secondary ring-1 ring-white/[0.08]">Programa archivado</span>}
            </div>
          ) : (
            plan.name !== DEFAULT_PLAN_NAME && <p className="mb-0.5 truncate font-display text-base font-bold text-text-primary">{plan.name}</p>
          )}
          {next && (
            <p className="truncate text-sm text-text-secondary">
              Siguiente: <span className="font-semibold text-primary-soft">{planLetter(next.position)} · {next.template.name}</span>
            </p>
          )}
        </div>
        {canManage && (program ? (
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" onClick={onEdit} className="min-h-10 px-3 text-sm">Cambiar</Button>
            <Button variant="ghost" onClick={onRemove} className="min-h-10 px-3 text-sm">Quitar</Button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={onEdit} aria-label="Editar serie" className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"><Pencil size={17} /></button>
            <button type="button" onClick={onRemove} aria-label="Quitar serie" className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-danger/10 hover:text-red-200 focus-ring"><Trash2 size={17} /></button>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <RoutineSequenceChips items={plan.items} nextPosition={plan.nextPosition} onSelect={canManage ? onSetNext : undefined} disabled={pending} />
      </div>
      {canManage && plan.items.length > 1 && <p className="mt-3 text-xs text-text-muted">Toca una rutina para marcarla como la siguiente.</p>}
    </Panel>
  );
}

type PlanMode = 'program' | 'custom';

export function PlanEditorDialog({ plan, onClose, onSave }: {
  plan: ClientRoutinePlan | null;
  onClose: () => void;
  onSave: (data: ClientRoutinePlanInput) => Promise<void>;
}) {
  const [mode, setMode] = useState<PlanMode>(plan && !plan.programId ? 'custom' : 'program');

  return (
    <Dialog label={plan ? 'Editar serie de rutinas' : 'Asignar serie de rutinas'} onClose={onClose} className="max-w-lg">
      <h2 className="pr-10 text-xl font-bold text-text-primary">{plan ? 'Editar serie' : 'Asignar serie'}</h2>
      <div role="radiogroup" aria-label="Tipo de serie" className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-white/[0.08] bg-background/60 p-1">
        {([
          { key: 'program', label: 'Seguir un programa' },
          { key: 'custom', label: 'Serie personalizada' },
        ] as const).map((option) => (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={mode === option.key}
            onClick={() => setMode(option.key)}
            className={`min-h-[40px] rounded-full px-3 text-sm font-semibold transition-colors duration-150 focus-ring ${
              mode === option.key ? 'bg-primary text-primary-contrast' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {mode === 'program'
        ? <ProgramPlanForm plan={plan} onClose={onClose} onSave={onSave} />
        : <CustomPlanForm plan={plan} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

interface PlanFormProps {
  plan: ClientRoutinePlan | null;
  onClose: () => void;
  onSave: (data: ClientRoutinePlanInput) => Promise<void>;
}

function DialogFooter({ onClose, onSave, saving, label }: { onClose: () => void; onSave: () => void; saving: boolean; label: string }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2">
      <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button type="button" variant="primary" onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : label}</Button>
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  return error ? <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p> : null;
}

function ProgramPlanForm({ plan, onClose, onSave }: PlanFormProps) {
  const { data: programs = [], isLoading } = useRoutinePrograms();
  const [programId, setProgramId] = useState<string | null>(plan?.programId ?? null);
  const [nextPosition, setNextPosition] = useState(plan?.programId ? plan.nextPosition : 1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = programs.find((program) => program.id === programId);

  const pick = (program: RoutineProgram) => {
    setProgramId(program.id);
    // Keep the client's position when re-picking the program they already follow.
    setNextPosition(program.id === plan?.programId && plan.nextPosition <= program.items.length ? plan.nextPosition : 1);
    setError(null);
  };

  const save = async () => {
    if (!selected) {
      setError('Elige un programa');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ programId: selected.id, nextPosition: Math.min(nextPosition, selected.items.length) || 1 });
    } catch (err) {
      setError(errorMessage(err, 'No se pudo asignar el programa'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <p className="eyebrow mb-2 mt-5 text-xs text-text-muted">Programa</p>
      {isLoading && <p className="text-sm text-text-secondary">Cargando programas...</p>}
      {!isLoading && programs.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/[0.12] px-4 py-4 text-center text-sm text-text-secondary">No hay programas activos. Créalos en Rutinas → Programas o usa una serie personalizada.</p>
      )}
      <div role="radiogroup" aria-label="Programas" className="space-y-2">
        {programs.map((program) => {
          const checked = program.id === programId;
          return (
            <button
              key={program.id}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={program.name}
              onClick={() => pick(program)}
              className={`block w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-150 focus-ring ${
                checked ? 'border-primary bg-primary/[0.08]' : 'border-white/[0.08] bg-background/60 hover:border-primary/40'
              }`}
            >
              <span className="block truncate font-semibold text-text-primary">{program.name}</span>
              <span className="mt-0.5 block truncate text-xs text-text-muted">
                {sortedProgramItems(program).map((item) => `${planLetter(item.position)} ${item.template.name}`).join(' · ')}
              </span>
            </button>
          );
        })}
      </div>

      {selected && selected.items.length > 1 && (
        <>
          <p className="eyebrow mb-2 mt-5 text-xs text-text-muted">Empieza por</p>
          <RoutineSequenceChips
            items={sortedProgramItems(selected)}
            nextPosition={nextPosition}
            onSelect={setNextPosition}
            label="Siguiente rutina del programa"
          />
        </>
      )}

      <FormError error={error} />
      <DialogFooter onClose={onClose} onSave={() => void save()} saving={saving} label="Seguir programa" />
    </>
  );
}

function CustomPlanForm({ plan, onClose, onSave }: PlanFormProps) {
  const { data: routines = [], isLoading } = useRoutines();
  const [name, setName] = useState(plan?.name ?? DEFAULT_PLAN_NAME);
  const [selected, setSelected] = useState<RoutineTemplate[]>(() => plan?.items.map((item) => item.template) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-text-primary">Nombre</span>
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={191} className="w-full" />
      </label>
      <div className="mt-5">
        <RoutineSequenceEditor value={selected} onChange={setSelected} catalog={routines} catalogLoading={isLoading} />
      </div>
      <FormError error={error} />
      <DialogFooter onClose={onClose} onSave={() => void save()} saving={saving} label="Guardar serie" />
    </>
  );
}
