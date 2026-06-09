import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import {
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthUser, removeToken } from '../store/auth';
import { useAuthUser } from '../hooks/useAuthUser';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border-primary shadow-sm',
  secondary: 'bg-elevated text-text-primary hover:bg-surface border-border',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface border-transparent',
  danger: 'bg-elevated text-red-600 hover:bg-red-50 border-red-200 dark:text-red-300 dark:hover:bg-red-950/30 dark:border-red-900/60',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-[44px] rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-[44px] rounded-md border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring ${className}`}
      {...props}
    />
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
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border bg-elevated text-text-secondary transition-colors hover:bg-surface focus-ring"
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
    <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-surface p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors focus-ring ${
              active
                ? 'bg-elevated text-primary shadow-sm'
                : 'text-text-secondary hover:bg-elevated'
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

  const logout = () => {
    removeToken();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, active: location.pathname === '/admin' },
        {
          label: 'Clientes',
          path: '/admin/clients',
          icon: Users,
          active: location.pathname.startsWith('/admin/clients'),
        },
        {
          label: 'Entrenadores',
          path: '/admin/trainers',
          icon: User,
          active: location.pathname.startsWith('/admin/trainers'),
        },
        {
          label: 'Ejercicios',
          path: '/admin/exercises',
          icon: Dumbbell,
          active: location.pathname.startsWith('/admin/exercises'),
        },
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-border bg-elevated px-5 py-6 lg:flex lg:flex-col">
        <button
          onClick={() => navigate('/')}
          className="mb-10 flex min-h-[54px] items-center gap-3 rounded-md text-left focus-ring"
          aria-label="Ir al panel"
        >
          <span className="relative flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-xl font-black text-primary">
            {brand.mark}
            <span className="absolute -top-1 h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>
            <span className="block text-3xl font-bold leading-none tracking-tight text-text-primary">
              {brand.appName}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {brand.claim}
            </span>
          </span>
        </button>

        <nav aria-label="Navegación principal" className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-md px-4 text-left text-sm font-semibold transition-colors focus-ring ${
                  item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
                    item.active
                      ? 'border-primary/30 bg-elevated text-primary'
                      : 'border-border bg-elevated text-text-secondary'
                  }`}
                >
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-md border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-text-primary">
            {isAdmin ? 'Gestión del centro' : 'Modo entrenador'}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {isAdmin
              ? 'Administra clientes, entrenadores y ejercicios.'
              : 'Busca clientes y actualiza marcas durante la sesión.'}
          </p>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-border bg-elevated/95 backdrop-blur">
          <div className="flex min-h-[78px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <button
              onClick={() => navigate('/')}
              className="flex min-h-[44px] items-center gap-3 rounded-md text-left focus-ring lg:hidden"
              aria-label="Ir al panel"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                {brand.mark}
              </span>
              <span>
                <span className="block text-base font-semibold text-text-primary">{title}</span>
                <span className="hidden text-xs text-text-secondary sm:block">
                  {brand.shortName}
                </span>
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              {onSearchChange && (
                <label className="relative block max-w-xl">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-secondary">
                    <Search size={18} />
                  </span>
                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-12 w-full rounded-md border border-border bg-elevated pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary shadow-sm focus-ring"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <ThemeToggle compact />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-text-primary text-sm font-bold text-background">
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
          </div>
        </header>

        <main role="main" className="px-4 pb-24 pt-5 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navegación móvil"
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-elevated px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] lg:hidden ${
          navItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}
      >
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={`mobile-${item.label}-${item.path}`}
              onClick={() => navigate(item.path)}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors focus-ring ${
                item.active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
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
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-gray-400'
        }`}
      />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export function MetricChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-elevated px-3 py-2">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-elevated px-6 py-10 text-center">
      <p className="font-medium text-text-primary">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  );
}
