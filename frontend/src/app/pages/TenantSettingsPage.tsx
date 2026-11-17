import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Building2, Check, Save, Scale } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { Button, EmptyState, PageHeader, Panel, SectionHeader, TextInput } from '@shared/components/ui';
import { useCurrentTenant, useUpdateCurrentTenant } from '@features/auth/hooks/useAuthUser';

const TENANT_NAME_MAX_LENGTH = 191;

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | string | undefined;
    if (typeof data === 'object' && data?.error) return data.error;
    const status = error.response?.status;
    const suffix = status ? ` (HTTP ${status})` : '';
    return `No se pudo guardar el nombre del centro${suffix}.`;
  }
  return 'No se pudo guardar el nombre del centro.';
}

export default function TenantSettingsPage() {
  const { data: tenant, isLoading, isError } = useCurrentTenant();
  const updateMutation = useUpdateCurrentTenant();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) setName(tenant.name);
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

  const trimmedName = name.trim();
  const isInvalid = !trimmedName;
  const isUnchanged = trimmedName === tenant.name;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isInvalid) {
      setFormError('El nombre del centro es obligatorio');
      return;
    }

    setFormError(null);
    try {
      await updateMutation.mutateAsync({ name: trimmedName });
      setSaved(true);
    } catch (error) {
      setFormError(getApiError(error));
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administración"
        title="Ajustes del centro"
        description="Datos básicos de tu centro dentro de STELIOS."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-5 sm:p-6">
          <SectionHeader title="Identidad del centro" description="El nombre que ven tu equipo y tus clientes." />

          <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-xl">
            <label htmlFor="tenant-name" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Nombre del centro
            </label>
            <TextInput
              id="tenant-name"
              value={name}
              maxLength={TENANT_NAME_MAX_LENGTH}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
                setFormError(null);
              }}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'tenant-name-error' : undefined}
              className={`w-full ${formError ? 'border-danger focus:border-danger focus:ring-danger/25' : ''}`}
            />

            {formError && (
              <p id="tenant-name-error" role="alert" className="mt-2 text-sm text-red-300">
                {formError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending || isUnchanged || isInvalid}
                className="inline-flex items-center gap-2"
              >
                <Save size={16} />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              {saved && (
                <p role="status" className="inline-flex items-center gap-1.5 text-sm text-primary-soft">
                  <Check size={16} />
                  Cambios guardados
                </p>
              )}
            </div>
          </form>
        </Panel>

        <Panel className="h-fit p-5 sm:p-6 lg:col-start-2 lg:row-start-1">
          <p className="eyebrow text-xs text-text-muted">Centro activo</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
              <Building2 size={19} />
            </span>
            <p className="min-w-0 truncate font-display text-lg font-bold text-text-primary">{trimmedName || tenant.name}</p>
          </div>
          <p className="mt-5 border-t border-white/[0.08] pt-4 text-sm leading-6 text-text-secondary">
            La identidad visual es la de STELIOS en todos los centros.
          </p>
        </Panel>
        <FeaturesPanel enabled={tenant.measurementsEnabled} />
      </div>
    </AppShell>
  );
}

function FeaturesPanel({ enabled }: { enabled: boolean }) {
  const updateMutation = useUpdateCurrentTenant();
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setError(null);
    try {
      await updateMutation.mutateAsync({ measurementsEnabled: !enabled });
    } catch (toggleError) {
      setError(getApiError(toggleError).replace('el nombre del centro', 'el ajuste'));
    }
  };

  return (
    <Panel className="p-5 sm:p-6">
      <SectionHeader title="Funciones" description="Activa solo lo que tu centro usa." />
      <div className="mt-5 flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-background/40 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
          <Scale size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="measurements-toggle-label" className="font-semibold text-text-primary">Seguimiento de mediciones y objetivos</p>
          <p id="measurements-toggle-description" className="mt-0.5 text-sm text-text-muted">
            Peso, grasa corporal y masa muscular en la ficha de cada cliente, con su evolución y su objetivo.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="measurements-toggle-label"
          aria-describedby="measurements-toggle-description"
          disabled={updateMutation.isPending}
          onClick={() => void toggle()}
          className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 disabled:opacity-60 focus-ring ${
            enabled ? 'border-primary bg-primary' : 'border-white/[0.14] bg-white/[0.06]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 rounded-full shadow transition-transform duration-150 ${enabled ? 'translate-x-6 bg-primary-contrast' : 'translate-x-1 bg-text-secondary'}`}
          />
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </Panel>
  );
}
