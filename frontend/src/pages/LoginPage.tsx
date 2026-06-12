import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, LogIn, ShieldCheck } from 'lucide-react';
import { login, selectTenant } from '../api/auth';
import { setStoredTenantBrand, setToken } from '../store/auth';
import { Button, Panel, TextInput, ThemeToggle } from '../components/ui';
import { PLATFORM_BRAND } from '../config/branding';
import type { LoginSuccessResponse, TenantOption } from '../types/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const reason = searchParams.get('reason');
  const nextPath = searchParams.get('next');

  const getSafeNextPath = () => {
    if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
      return null;
    }

    if (nextPath.startsWith('/login')) {
      return null;
    }

    return nextPath;
  };

  const completeLogin = (response: LoginSuccessResponse) => {
    setStoredTenantBrand(response.tenant);
    setToken(response.token);
    navigate(getSafeNextPath() ?? (response.user.role === 'ADMIN' ? '/admin' : '/trainer'), {
      replace: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(email, password);
      if ('tenantSelectionRequired' in response) {
        setSelectionToken(response.selectionToken);
        setTenantOptions(response.tenants);
        return;
      }

      completeLogin(response);
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantSelect = async (tenantId: string) => {
    if (!selectionToken) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await selectTenant(selectionToken, tenantId);
      completeLogin(response);
    } catch {
      setError('No se pudo acceder a ese centro');
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = 'mb-1 block text-sm font-medium text-text-primary';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_8%,rgba(var(--color-primary)/0.22),transparent_32%),radial-gradient(circle_at_78%_16%,rgba(99,102,241,0.16),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white shadow-[0_18px_42px_rgba(var(--color-primary)/0.36)]">
            {PLATFORM_BRAND.mark}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{PLATFORM_BRAND.appName}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {PLATFORM_BRAND.description}
          </p>
        </div>

        <Panel className="p-6">
          {reason === 'session-expired' && !selectionToken && (
            <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
              Tu sesión ha caducado. Inicia sesión de nuevo para continuar.
            </div>
          )}

          {reason === 'auth-required' && !selectionToken && (
            <div className="mb-4 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 text-sm text-text-secondary">
              Inicia sesión para acceder a la plataforma.
            </div>
          )}

          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <ShieldCheck size={14} />
                Acceso seguro
              </p>
              <h2 className="mb-1 text-xl font-semibold text-text-primary">Iniciar sesión</h2>
              <p className="text-sm text-text-secondary">Accede con tu cuenta del centro.</p>
            </div>
            <ThemeToggle compact />
          </div>

          {selectionToken ? (
            <div>
              <div className="mb-4 rounded-2xl border border-border/70 bg-surface/70 p-3">
                <p className="text-sm font-semibold text-text-primary">Selecciona centro</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Tu usuario tiene acceso a varios espacios de trabajo.
                </p>
              </div>

              <div className="space-y-2">
                {tenantOptions.map((tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => handleTenantSelect(tenant.id)}
                    disabled={isLoading}
                    className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-border/70 bg-elevated/80 px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:opacity-60 focus-ring"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Building2 size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-text-primary">{tenant.name}</span>
                      <span className="block text-xs text-text-secondary">{tenant.organizationName}</span>
                    </span>
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => {
                  setSelectionToken(null);
                  setTenantOptions([]);
                }}
              >
                Volver al login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <TextInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  autoComplete="email"
                  className="w-full"
                  aria-required="true"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className={labelClass}>
                  Contraseña
                </label>
                <TextInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full"
                  aria-required="true"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-500/10 dark:text-red-200"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                variant="primary"
                className="inline-flex w-full items-center justify-center gap-2"
              >
                {!isLoading && <LogIn size={17} />}
                {isLoading ? 'Iniciando sesión...' : 'Entrar'}
              </Button>
            </form>
          )}

          {selectionToken && error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
