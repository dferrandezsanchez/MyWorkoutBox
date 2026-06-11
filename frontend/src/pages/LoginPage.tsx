import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogIn } from 'lucide-react';
import { login, selectTenant } from '../api/auth';
import { setStoredTenantBrand, setToken } from '../store/auth';
import { Button, TextInput, ThemeToggle } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import type { LoginSuccessResponse, TenantOption } from '../types/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const { brand } = useTheme();

  const completeLogin = (response: LoginSuccessResponse) => {
    setStoredTenantBrand(response.tenant);
    setToken(response.token);
    navigate(response.user.role === 'ADMIN' ? '/admin' : '/trainer');
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-primary text-lg font-bold text-white shadow-sm">
            {brand.mark}
          </span>
          <h1 className="text-2xl font-semibold text-text-primary">{brand.appName}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {brand.description}
          </p>
        </div>

        <div className="rounded-md border border-border bg-elevated p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-text-primary">Iniciar sesión</h2>
              <p className="text-sm text-text-secondary">Accede con tu cuenta de entrenador.</p>
            </div>
            <ThemeToggle compact />
          </div>

          {selectionToken ? (
            <div>
              <div className="mb-4 rounded-md border border-border bg-surface p-3">
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
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-md border border-border bg-elevated px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60 focus-ring"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
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
                  className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300"
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
        </div>
      </div>
    </div>
  );
}
