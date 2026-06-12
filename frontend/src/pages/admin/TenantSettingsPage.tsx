import { useEffect, useState } from 'react';
import { Palette, Save } from 'lucide-react';
import { AppShell, Button, EmptyState, PageHeader, Panel, TextInput } from '../../components/ui';
import { PLATFORM_BRAND } from '../../config/branding';
import { useCurrentTenant, useUpdateCurrentTenant } from '../../hooks/useAuthUser';

const DEFAULT_COLORS = {
  primary: PLATFORM_BRAND.primary,
  primaryHover: PLATFORM_BRAND.primaryHover,
  primarySoft: PLATFORM_BRAND.primarySoft,
};

export default function TenantSettingsPage() {
  const { data: tenant, isLoading, isError } = useCurrentTenant();
  const updateMutation = useUpdateCurrentTenant();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    mark: '',
    claim: '',
    description: '',
    primary: DEFAULT_COLORS.primary,
    primaryHover: DEFAULT_COLORS.primaryHover,
    primarySoft: DEFAULT_COLORS.primarySoft,
  });

  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant.name,
      shortName: tenant.shortName,
      mark: tenant.mark,
      claim: tenant.claim,
      description: tenant.description,
      primary: tenant.primary,
      primaryHover: tenant.primaryHover,
      primarySoft: tenant.primarySoft,
    });
  }, [tenant]);

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-text-secondary">Cargando ajustes...</p>
      </AppShell>
    );
  }

  if (isError || !tenant) {
    return (
      <AppShell>
        <EmptyState title="No se pudieron cargar los ajustes" />
      </AppShell>
    );
  }

  const setValue = (key: keyof typeof form, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetToProductDefault = () => {
    setSaved(false);
    setForm((current) => ({
      ...current,
      name: current.name || PLATFORM_BRAND.name,
      shortName: current.shortName || PLATFORM_BRAND.shortName,
      mark: current.mark || PLATFORM_BRAND.mark,
      claim: PLATFORM_BRAND.claim,
      description: PLATFORM_BRAND.description,
      ...DEFAULT_COLORS,
    }));
  };

  const inputLabel = 'mb-1.5 block text-sm font-semibold text-text-secondary';

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administración"
        title="Ajustes del centro"
        description="Personaliza la identidad visual de este tenant sin cambiar la marca principal de MyWorkoutBox."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-4 sm:p-6">
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaved(false);
              await updateMutation.mutateAsync(form);
              setSaved(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
              <div>
                <label className={inputLabel} htmlFor="tenant-name">Nombre del centro</label>
                <TextInput
                  id="tenant-name"
                  value={form.name}
                  onChange={(event) => setValue('name', event.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className={inputLabel} htmlFor="tenant-short">Nombre corto</label>
                <TextInput
                  id="tenant-short"
                  value={form.shortName}
                  onChange={(event) => setValue('shortName', event.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.45fr_1fr]">
              <div>
                <label className={inputLabel} htmlFor="tenant-mark">Marca</label>
                <TextInput
                  id="tenant-mark"
                  value={form.mark}
                  maxLength={4}
                  onChange={(event) => setValue('mark', event.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className={inputLabel} htmlFor="tenant-claim">Claim</label>
                <TextInput
                  id="tenant-claim"
                  value={form.claim}
                  onChange={(event) => setValue('claim', event.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className={inputLabel} htmlFor="tenant-description">Descripción</label>
              <textarea
                id="tenant-description"
                value={form.description}
                onChange={(event) => setValue('description', event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-border/70 bg-elevated/90 px-3 py-2 text-sm text-text-primary shadow-sm placeholder:text-text-muted focus-ring"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Colores del tenant</p>
                  <p className="text-sm text-text-secondary">Se aplican como acento visual tras el login.</p>
                </div>
                <Button type="button" onClick={resetToProductDefault} variant="secondary" className="min-h-10 px-3">
                  Usar MyWorkoutBox
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ColorField label="Principal" value={form.primary} onChange={(value) => setValue('primary', value)} />
                <ColorField label="Hover" value={form.primaryHover} onChange={(value) => setValue('primaryHover', value)} />
                <ColorField label="Suave" value={form.primarySoft} onChange={(value) => setValue('primarySoft', value)} />
              </div>
            </div>

            {saved && <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">Ajustes guardados.</p>}
            {updateMutation.isError && (
              <p className="text-sm font-semibold text-red-600 dark:text-red-300">
                No se pudieron guardar los ajustes. Revisa los campos.
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending || !form.name.trim() || !form.shortName.trim() || !form.mark.trim()}
              className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Save size={16} />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar ajustes'}
            </Button>
          </form>
        </Panel>

        <Panel className="overflow-hidden p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Palette size={22} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Vista previa</h2>
              <p className="text-sm text-text-secondary">MyWorkoutBox mantiene presencia; el centro aporta contexto y acento.</p>
            </div>
          </div>

          <div
            className="rounded-3xl border border-border/70 bg-background p-4"
            style={{
              ['--preview-primary' as string]: form.primary,
              ['--preview-soft' as string]: form.primarySoft,
            }}
          >
            <div className="rounded-2xl border border-border/70 bg-elevated p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white" style={{ backgroundColor: form.primary }}>
                  {form.mark || 'MW'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold text-text-primary">MyWorkoutBox</p>
                  <p className="truncate text-xs uppercase tracking-[0.2em] text-text-secondary">{PLATFORM_BRAND.claim}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-surface/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Centro activo</p>
                <p className="mt-1 truncate font-semibold text-text-primary">{form.name || tenant.name}</p>
                <p className="mt-1 text-sm text-text-secondary">{form.claim || tenant.claim}</p>
              </div>

              <button
                type="button"
                className="mt-4 min-h-[44px] w-full rounded-xl px-4 text-sm font-semibold text-white"
                style={{ backgroundColor: form.primary }}
              >
                Acción principal
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-border/70 bg-surface/70 p-3">
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <span className="mt-3 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 rounded-lg border border-border bg-transparent"
        />
        <TextInput
          value={value}
          onChange={(event) => onChange(event.target.value)}
          pattern="^#[0-9A-Fa-f]{6}$"
          className="min-w-0 flex-1"
        />
      </span>
    </label>
  );
}
