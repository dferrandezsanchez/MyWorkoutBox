import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setToken } from '../store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(email, password);
      setToken(response.token);
      navigate('/');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full border border-border rounded-md px-3 py-2 min-h-[44px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* App title */}
        <h1 className="text-2xl font-bold text-text-primary text-center mb-8">
          Control de Marcas
        </h1>

        {/* Card */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                autoComplete="email"
                className={inputClass}
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className={labelClass}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputClass}
                aria-required="true"
              />
            </div>

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="text-red-500 text-sm mb-4 text-center"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
