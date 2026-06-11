import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import {
  Activity,
  Building2,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthUser, removeToken } from '../store/auth';
import { useAuthUser } from '../hooks/useAuthUser';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { PLATFORM_BRAND } from '../config/branding';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border-primary bg-primary text-white shadow-[0_14px_34px_rgba(var(--color-primary)/0.32)] hover:bg-primary-hover',
  secondary:
    'border-border/80 bg-elevated/80 text-text-primary shadow-sm hover:bg-surface',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:bg-surface/80 hover:text-text-primary',
  danger:
    'border-red-300/50 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-[46px] rounded-lg border border-border/80 bg-elevated/90 px-3 py-2 text-sm text-text-primary shadow-sm placeholder:text-text-muted focus-ring ${className}`}
      {...props}
    />
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border/70 bg-elevated/85 shadow-panel backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: LucideIcon;
  tone?: 'primary' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const toneClass = {
    primary: 'bg-primary/15 text-primary ring-primary/20',
    blue: 'bg-sky-500/15 text-sky-500 dark:text-sky-300 ring-sky-500/20',
    green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/20',
    red: 'bg-red-500/15 text-red-600 dark:text-red-300 ring-red-500/20',
  }[tone];

  return (
    <Panel className="relative overflow-hidden p-4">
      <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">{value}</p>
          {detail && <p className="mt-1 text-xs font-semibold text-text-secondary">{detail}</p>}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClass}`}>
          <Icon size={20} />
        </span>
      </div>
    </Panel>
  );
}

export function ActionTile({
  title,
  description,
  icon: Icon,
  onClick,
  className = '',
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group min-h-[96px] rounded-xl border border-border/70 bg-surface/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 focus-ring ${className}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon size={19} />
      </span>
      <span className="block text-sm font-semibold text-text-primary">{title}</span>
      {description && <span className="mt-1 block text-xs leading-5 text-text-secondary">{description}</span>}
    </button>
  );
}

export function MobileActionButton({
  label = 'Acción rápida',
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-6 items-center justify-center rounded-2xl border border-primary/40 bg-primary text-white shadow-[0_18px_42px_rgba(var(--color-primary)/0.45)] focus-ring"
    >
      <Zap size={24} fill="currentColor" />
    </button>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, resolvedTheme, setPreference, toggleTheme } = useTheme();
  const nextLabel = resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/70 bg-elevated/85 text-text-secondary shadow-sm transition-colors hover:bg-surface hover:text-text-primary focus-ring"
        aria-label={nextLabel}
        title={nextLabel}
      >
        {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  const options: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
    { value: 'system', label: 'Sistema', icon: Settings },
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-surface/70 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors focus-ring ${
              active
                ? 'bg-elevated text-primary shadow-sm'
                : 'text-text-secondary hover:bg-elevated/80 hover:text-text-primary'
            }`}
          >
            <Icon size={16} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function AppShell({
  children,
  title = 'Control de Marcas',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar cliente',
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const { data: fullUser } = useAuthUser();
  const { brand } = useTheme();
  const displayUser = fullUser ?? user;
  const isAdmin = user?.role === 'ADMIN';

  const logout = () => {
    removeToken();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, active: location.pathname === '/admin' },
        { label: 'Clientes', path: '/admin/clients', icon: Users, active: location.pathname.startsWith('/admin/clients') },
        { label: 'Entrenadores', path: '/admin/trainers', icon: User, active: location.pathname.startsWith('/admin/trainers') },
        { label: 'Ejercicios', path: '/admin/exercises', icon: Dumbbell, active: location.pathname.startsWith('/admin/exercises') },
      ]
    : [
        {
          label: 'Clientes',
          path: '/trainer',
          icon: Users,
          active: location.pathname === '/trainer' || /^\/clients\/[^/]+$/.test(location.pathname),
        },
        {
          label: 'Cuenta',
          path: '/trainer/account',
          icon: User,
          active: location.pathname.startsWith('/trainer/account'),
        },
      ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(var(--color-primary)/0.16),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.12),transparent_28%)]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[282px] border-r border-white/10 bg-[#07111f]/95 px-5 py-6 text-white shadow-2xl backdrop-blur-xl lg:flex lg:flex-col dark:bg-[#07111f]/95">
        <button
          onClick={() => navigate('/')}
          className="mb-7 flex min-h-[58px] items-center gap-3 rounded-xl text-left focus-ring"
          aria-label="Ir al panel"
        >
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-xl font-black text-primary ring-1 ring-primary/25">
            {PLATFORM_BRAND.mark}
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_rgba(var(--color-primary)/0.85)]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-2xl font-bold leading-none text-white">
              {PLATFORM_BRAND.appName}
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">
              {PLATFORM_BRAND.claim}
            </span>
          </span>
        </button>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">
            <Building2 size={14} />
            Centro activo
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-white">{brand.name}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Tenant operativo
          </div>
        </div>

        <nav aria-label="Navegación principal" className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all focus-ring ${
                  item.active
                    ? 'bg-primary text-white shadow-[0_14px_30px_rgba(var(--color-primary)/0.32)]'
                    : 'text-white/68 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    item.active ? 'bg-white/14 text-white' : 'bg-white/[0.05] text-white/60'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {isAdmin ? <Activity size={18} /> : <Zap size={18} />}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                {isAdmin ? 'Control del centro' : 'Modo entrenador'}
              </p>
              <p className="text-xs text-white/50">
                {isAdmin ? 'Gestión real del MVP' : 'Listo para registrar marcas'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[282px]">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <div className="flex min-h-[78px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <button
              onClick={() => navigate('/')}
              className="flex min-h-[44px] min-w-0 items-center gap-3 rounded-xl text-left focus-ring lg:hidden"
              aria-label="Ir al panel"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-[0_10px_24px_rgba(var(--color-primary)/0.34)]">
                {PLATFORM_BRAND.mark}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-text-primary">{title}</span>
                <span className="block truncate text-xs text-text-secondary">{brand.name}</span>
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              {onSearchChange && (
                <label className="relative block max-w-xl">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                    <Search size={18} />
                  </span>
                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-12 w-full rounded-xl border border-border/70 bg-elevated/80 pl-12 pr-4 text-sm text-text-primary shadow-sm placeholder:text-text-secondary focus-ring"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle compact />
              <span className="hidden h-10 w-px bg-border sm:block" />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-text-primary text-sm font-bold text-background ring-2 ring-primary/20">
                {(displayUser?.name || displayUser?.email || 'U').slice(0, 2).toUpperCase()}
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-text-primary">
                  {displayUser?.name || displayUser?.email || 'Usuario'}
                </p>
                <p className="text-xs text-text-secondary">
                  {displayUser?.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}
                </p>
              </div>
              <Button variant="ghost" onClick={logout} className="gap-2 px-3 sm:inline-flex sm:items-center">
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </header>

        <main role="main" className="px-4 pb-28 pt-5 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navegación móvil"
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-elevated/95 px-2 pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-2 shadow-[0_-16px_42px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden ${
          isAdmin ? 'grid grid-cols-4 gap-1' : 'grid grid-cols-[1fr_72px_1fr] gap-1'
        }`}
      >
        {isAdmin ? (
          navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`mobile-${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors focus-ring ${
                  item.active ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })
        ) : (
          <>
            {navItems.slice(0, 1).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={`mobile-${item.label}-${item.path}`}
                  onClick={() => navigate(item.path)}
                  className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors focus-ring ${
                    item.active ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="relative min-h-[58px]">
              <MobileActionButton label="Buscar cliente" onClick={() => navigate('/trainer')} />
            </div>
            {navItems.slice(1).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={`mobile-${item.label}-${item.path}`}
                  onClick={() => navigate(item.path)}
                  className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors focus-ring ${
                    item.active ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        active
          ? 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
          : 'bg-text-muted/10 text-text-secondary ring-border'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-text-muted'
        }`}
      />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export function MetricChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-elevated/80 px-3 py-2 shadow-sm">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-elevated/70 px-6 py-10 text-center">
      <p className="font-medium text-text-primary">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  );
}
