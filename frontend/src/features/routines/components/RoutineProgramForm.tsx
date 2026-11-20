import { useState, type FormEvent, type ReactNode } from 'react';
import { RoutineSequenceChips } from '@features/routines/components/RoutineSequenceChips';
import { RoutineSequenceEditor } from '@features/routines/components/RoutineSequenceEditor';
import { sortedProgramItems } from '@features/routines/utils/routine-labels';
import { Button, Panel, TextInput } from '@shared/components/ui';
import type { RoutineProgram, RoutineProgramInput, RoutineTemplate } from '@shared/types/api';

interface RoutineProgramFormProps {
  initial?: RoutineProgram;
  /** Active templates offered in the picker. */
  catalog: RoutineTemplate[];
  catalogLoading?: boolean;
  readOnly?: boolean;
  submitLabel?: string;
  onSubmit: (data: RoutineProgramInput) => Promise<void>;
  /** Extra actions rendered next to the submit button (e.g. archive). */
  actions?: ReactNode;
}

export function RoutineProgramForm({ initial, catalog, catalogLoading = false, readOnly = false, submitLabel = 'Guardar programa', onSubmit, actions }: RoutineProgramFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [sequence, setSequence] = useState<RoutineTemplate[]>(() => (initial ? sortedProgramItems(initial).map((item) => item.template) : []));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (readOnly) {
    return (
      <div className="space-y-4">
        {initial?.notes && <Panel className="border-l-2 border-l-primary/70 p-4 text-sm leading-6 text-text-secondary">{initial.notes}</Panel>}
        <Panel className="p-4 sm:p-5">
          <RoutineSequenceChips items={initial ? sortedProgramItems(initial) : []} label="Rutinas del programa" />
        </Panel>
      </div>
    );
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Pon un nombre al programa';
    if (sequence.length === 0) return 'Añade al menos una rutina';
    if (sequence.some((routine) => routine.status === 'INACTIVE')) return 'Quita las rutinas archivadas para guardar';
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), notes: notes.trim() || null, templateIds: sequence.map((routine) => routine.id) });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'No se pudo guardar el programa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5" noValidate>
      <Panel className="space-y-4 p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-primary">Nombre</span>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={191} placeholder="Ej. Fuerza 3 días" className="w-full" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-primary">Notas <span className="font-normal text-text-muted">(opcional)</span></span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Objetivo, frecuencia, indicaciones..."
            className="w-full resize-none rounded-xl border border-border bg-background/60 p-3 text-sm text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>
      </Panel>

      <Panel className="p-4 sm:p-5">
        <RoutineSequenceEditor value={sequence} onChange={setSequence} catalog={catalog} catalogLoading={catalogLoading} noun="programa" listLabel="Rutinas del programa" />
      </Panel>

      {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {actions}
        <Button type="submit" variant="primary" disabled={saving} className="sm:min-w-[180px]">{saving ? 'Guardando...' : submitLabel}</Button>
      </div>
    </form>
  );
}
