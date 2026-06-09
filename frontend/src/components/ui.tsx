import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthUser, removeToken } from '../store/auth';
import { useAuthUser } from '../hooks/useAuthUser';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border-primary shadow-sm',
  secondary: 'bg-white text-[#4A4A4A] hover:bg-surface border-border',
  ghost: 'bg-transparent text-[#5A5A5A] hover:bg-surface border-transparent',
  danger: 'bg-white text-red-600 hover:bg-red-50 border-red-200',
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
      className={`min-h-[44px] rounded-md border border-border bg-white px-3 py-2 text-sm text-[#4A4A4A] placeholder:text-text-muted focus-ring ${className}`}
      {...props}
    />
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
  const displayUser = fullUser ?? user;

  const logout = () => {
    removeToken();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/admin', icon: 'D', active: location.pathname === '/admin' },
        {
          label: 'Clientes',
          path: '/admin/clients',
          icon: 'C',
          active: location.pathname.startsWith('/admin/clients'),
        },
        {
          label: 'Entrenadores',
          path: '/admin/trainers',
          icon: 'T',
          active: location.pathname.startsWith('/admin/trainers'),
        },
        {
          label: 'Ejercicios',
          path: '/admin/exercises',
          icon: 'E',
          active: location.pathname.startsWith('/admin/exercises'),
        },
      ]
    : [
        {
          label: 'Clientes',
          path: '/trainer',
          icon: 'C',
          active: location.pathname === '/trainer' || /^\/clients\/[^/]+$/.test(location.pathname),
        },
        {
          label: 'Cuenta',
          path: '/trainer/account',
          icon: 'U',
          active: location.pathname.startsWith('/trainer/account'),
        },
      ];

  return (
    <div className="min-h-screen bg-[#F7F7F6] text-[#353535]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-border bg-white px-5 py-6 lg:flex lg:flex-col">
        <button
          onClick={() => navigate('/')}
          className="mb-10 flex min-h-[54px] items-center gap-3 rounded-md text-left focus-ring"
          aria-label="Ir al panel"
        >
          <span className="relative flex h-12 w-12 items-center justify-center rounded-md bg-[#FFF1E8] text-xl font-black text-primary">
            t
            <span className="absolute -top-1 h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>
            <span className="block text-3xl font-bold leading-none tracking-tight text-[#5A5A5A]">
              tumeta
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
              Personal Training
            </span>
          </span>
        </button>

        <nav aria-label="Navegación principal" className="space-y-2">
          {navItems.map((item) => {
            return (
              <button
                key={`${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-md px-4 text-left text-sm font-semibold transition-colors focus-ring ${
                  item.active
                    ? 'bg-[#FFF1E8] text-primary'
                    : 'text-[#5F6267] hover:bg-surface hover:text-[#3F3F3F]'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
                    item.active
                      ? 'border-primary/30 bg-white text-primary'
                      : 'border-border bg-white text-[#6F7378]'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-md border border-border bg-[#FAFAFA] p-4">
          <p className="text-sm font-semibold text-[#3F3F3F]">
            {isAdmin ? 'Gestión del centro' : 'Modo entrenador'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5F6267]">
            {isAdmin
              ? 'Administra clientes, entrenadores y ejercicios.'
              : 'Busca clientes y actualiza marcas durante la sesión.'}
          </p>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex min-h-[78px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <button
              onClick={() => navigate('/')}
              className="flex min-h-[44px] items-center gap-3 rounded-md text-left focus-ring lg:hidden"
              aria-label="Ir al panel"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                TM
              </span>
              <span>
                <span className="block text-base font-semibold text-[#3F3F3F]">{title}</span>
                <span className="hidden text-xs text-text-secondary sm:block">
                  Centro de entrenamiento
                </span>
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              {onSearchChange && (
                <label className="relative block max-w-xl">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#6F7378]">
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-12 w-full rounded-md border border-border bg-white pl-12 pr-4 text-sm text-[#3F3F3F] placeholder:text-text-secondary shadow-sm focus-ring"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3F3F3F] text-sm font-bold text-white">
                  {(displayUser?.name || displayUser?.email || 'U').slice(0, 2).toUpperCase()}
                </span>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-[#3F3F3F]">
                    {displayUser?.name || displayUser?.email || 'Usuario'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {displayUser?.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}
                  </p>
                </div>
                <Button variant="ghost" onClick={logout} className="px-3">
                  Salir
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
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] lg:hidden ${
          navItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}
      >
        {navItems.slice(0, 3).map((item) => (
          <button
            key={`mobile-${item.label}-${item.path}`}
            onClick={() => navigate(item.path)}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors focus-ring ${
              item.active ? 'bg-[#FFF1E8] text-primary' : 'text-[#5F6267] hover:bg-surface'
            }`}
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
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
        <h1 className="text-3xl font-semibold tracking-tight text-[#282828]">{title}</h1>
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
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
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
    <div className="rounded-md border border-border bg-white px-3 py-2">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-[#3F3F3F]">{value}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-white px-6 py-10 text-center">
      <p className="font-medium text-[#4A4A4A]">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  );
}
