import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Settings2,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { OperationalHero } from '@app/components/OperationalHero';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import { useClients } from '@features/clients/hooks/useClients';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { useTrainers } from '@features/trainers/hooks/useTrainers';
import { useTheme } from '@shared/theme/useTheme';
import type { Client } from '@shared/types/api';

function calculateAge(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function hasDataIssue(client: Client): boolean {
  const age = calculateAge(client.birthDate);
  return age < 12 || age > 90 || (client.height == null && client.weight == null);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { brand } = useTheme();
  const { data: user } = useAuthUser();
  const { data: clients, isLoading: clientsLoading, isError: clientsError } = useClients(undefined, true);
  const { data: exercises, isLoading: exercisesLoading, isError: exercisesError } = useExercises(true);
  const { data: trainers, isLoading: trainersLoading, isError: trainersError } = useTrainers(true);

  const activeClients = useMemo(() => clients?.filter((client) => client.status === 'ACTIVE') ?? [], [clients]);
  const activeExercises = useMemo(() => exercises?.filter((exercise) => exercise.status === 'ACTIVE') ?? [], [exercises]);
  const activeTrainers = useMemo(() => trainers?.filter((trainer) => trainer.active) ?? [], [trainers]);
  const dataIssues = useMemo(() => activeClients.filter(hasDataIssue).slice(0, 6), [activeClients]);
  const hasLoadError = clientsError || exercisesError || trainersError;

  return (
    <AppShell title="Control del centro">
      <div className="mx-auto max-w-6xl space-y-5 pb-4 sm:space-y-6">
        <section className="px-1 py-1">
          <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">Hola, {user?.name || 'Admin'}</h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-base">¿Qué necesitas gestionar ahora?</p>
        </section>

        <OperationalHero
          eyebrow="Centro operativo"
          title="Controla tu centro"
          description={`${brand.name}: clientes, equipo y catálogo en un único espacio.`}
        />

        <section aria-labelledby="operational-summary-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="operational-summary-title" className="text-lg font-semibold text-text-primary">Resumen operativo</h2>
            <span className="text-xs text-text-muted">Datos actuales</span>
          </div>
          {hasLoadError && <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">No se pudo cargar todo el resumen operativo.</p>}
          <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-border/80 bg-elevated/80 shadow-panel">
            <OperationalMetric label="Clientes activos" value={clientsLoading ? '…' : activeClients.length} detail="Perfiles disponibles" icon={<Users size={19} />} tone="primary" />
            <OperationalMetric label="Entrenadores" value={trainersLoading ? '…' : activeTrainers.length} detail="Usuarios activos" icon={<UserCog size={19} />} tone="green" />
            <OperationalMetric label="Ejercicios" value={exercisesLoading ? '…' : activeExercises.length} detail="En el catálogo" icon={<Dumbbell size={19} />} tone="blue" />
            <OperationalMetric label="Datos a revisar" value={clientsLoading ? '…' : dataIssues.length} detail="Incidencias" icon={<AlertTriangle size={19} />} tone="amber" />
          </div>
        </section>

        <div className="grid gap-7 xl:grid-cols-[1.25fr_0.75fr]">
          <section aria-labelledby="management-title">
            <h2 id="management-title" className="mb-3 text-lg font-semibold text-text-primary">Gestión del centro</h2>
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-elevated/80 shadow-panel">
              <ManagementRow icon={<Users size={20} />} title="Clientes" description="Alta, edición y estado" onClick={() => navigate('/admin/clients')} tone="primary" />
              <ManagementRow icon={<UserCog size={20} />} title="Entrenadores" description="Accesos y permisos" onClick={() => navigate('/admin/trainers')} tone="green" />
              <ManagementRow icon={<Dumbbell size={20} />} title="Ejercicios" description="Catálogo del centro" onClick={() => navigate('/admin/exercises')} tone="violet" />
              <ManagementRow icon={<Settings2 size={20} />} title="Ajustes" description="Identidad y configuración" onClick={() => navigate('/admin/settings')} tone="amber" last />
            </div>
          </section>

          <section aria-labelledby="work-mode-title">
            <h2 id="work-mode-title" className="mb-3 text-lg font-semibold text-text-primary">Modo de trabajo</h2>
            <button type="button" onClick={() => navigate('/trainer')} className="group flex min-h-[112px] w-full items-center gap-4 rounded-2xl border border-border/80 bg-elevated/80 p-4 text-left shadow-panel transition-colors hover:border-primary/40 hover:bg-surface/70 focus-ring">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25"><Dumbbell size={22} /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold text-text-primary">Modo entrenador</span><span className="mt-1 block text-xs leading-5 text-text-secondary">Registrar sesiones y marcas en tiempo real.</span></span>
              <ChevronRight size={20} className="shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          </section>
        </div>

        <section aria-labelledby="review-title">
          <h2 id="review-title" className="mb-3 text-lg font-semibold text-text-primary">Datos a revisar</h2>
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-elevated/80 shadow-panel">
            {clientsError && <p className="p-5 text-sm text-red-300">No se pudieron cargar los clientes.</p>}
            {!clientsError && clientsLoading && <p className="p-5 text-sm text-text-secondary">Revisando perfiles...</p>}
            {!clientsError && !clientsLoading && dataIssues.length === 0 && (
              <div className="flex min-h-[108px] items-center gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20"><CheckCircle2 size={21} /></span>
                <div><p className="font-semibold text-text-primary">No hay incidencias visibles</p><p className="mt-1 text-sm text-text-secondary">Todo está al día.</p></div>
              </div>
            )}
            {!clientsError && dataIssues.length > 0 && (
              <div className="divide-y divide-border/70">
                {dataIssues.map((client) => <button key={client.id} type="button" onClick={() => navigate(`/admin/clients/${client.id}`)} className="flex min-h-[72px] w-full items-center gap-3 px-5 text-left transition-colors hover:bg-surface/70 focus-ring"><ShieldCheck size={18} className="shrink-0 text-amber-300" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text-primary">{client.firstName} {client.lastName}</span><span className="block text-xs text-text-secondary">Edad o datos físicos pendientes</span></span><ChevronRight size={18} className="text-text-muted" /></button>)}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function OperationalMetric({ label, value, detail, icon, tone }: { label: string; value: ReactNode; detail: string; icon: ReactNode; tone: 'primary' | 'green' | 'blue' | 'amber' }) {
  const tones = { primary: 'bg-primary/14 text-primary ring-primary/20', green: 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/20', blue: 'bg-sky-500/12 text-sky-300 ring-sky-500/20', amber: 'bg-amber-500/12 text-amber-300 ring-amber-500/20' };
  return <div className="grid min-w-0 grid-rows-[32px_28px_36px] border-r border-border/70 px-1.5 py-3 text-center last:border-r-0 sm:grid-rows-[40px_44px_42px_20px] sm:p-4 sm:text-left"><span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ring-1 sm:mx-0 sm:h-10 sm:w-10 sm:rounded-xl ${tones[tone]}`}>{icon}</span><p className="flex items-center justify-center text-[10px] font-semibold leading-3 text-text-secondary sm:items-end sm:justify-start sm:text-sm sm:leading-5">{label}</p><p className="self-end text-2xl font-semibold text-text-primary sm:text-3xl">{value}</p><p className="hidden self-end truncate text-xs text-text-muted sm:block">{detail}</p></div>;
}

function ManagementRow({ icon, title, description, onClick, tone, last = false }: { icon: ReactNode; title: string; description: string; onClick: () => void; tone: 'primary' | 'green' | 'violet' | 'amber'; last?: boolean }) {
  const tones = { primary: 'bg-primary/14 text-primary', green: 'bg-emerald-500/12 text-emerald-300', violet: 'bg-violet-500/12 text-violet-300', amber: 'bg-amber-500/12 text-amber-300' };
  return <button type="button" onClick={onClick} className={`flex min-h-[76px] w-full items-center gap-3 px-4 text-left transition-colors hover:bg-surface/70 focus-ring ${last ? '' : 'border-b border-border/70'}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{title}</span><span className="mt-0.5 block text-xs text-text-secondary">{description}</span></span><ChevronRight size={18} className="text-text-muted" /></button>;
}
