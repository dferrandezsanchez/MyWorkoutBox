import { useEffect, useState } from 'react';
import { KeyRound, LogOut, Palette, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AppShell from '@app/layout/AppShell';
import { Button, Panel, TextInput, ThemeToggle } from '@shared/components/ui';
import { useAuthUser, useChangePassword, useUpdateAuthUser } from '@features/auth/hooks/useAuthUser';
import { removeToken } from '@features/auth/model/auth-store';

export default function TrainerAccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useAuthUser();
  const updateMutation = useUpdateAuthUser();
  const passwordMutation = useChangePassword();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const logout = () => {
    removeToken();
    queryClient.clear();
    navigate('/login');
  };

  return (
    <AppShell title="Cuenta">
      <div className="mx-auto max-w-2xl space-y-5">
        <Panel className="overflow-hidden p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_14px_34px_rgba(var(--color-primary)/0.18)]">
              <UserCircle size={30} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Entrenador</p>
              <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight text-text-primary">Cuenta</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Datos de contacto, apariencia y seguridad.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          {isLoading && <p className="text-text-secondary">Cargando cuenta...</p>}
          {isError && <p className="text-red-500">Error al cargar la cuenta</p>}
          {user && (
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaved(false);
                await updateMutation.mutateAsync({ name, email });
                setSaved(true);
              }}
            >
              <div>
                <label htmlFor="account-name" className="mb-1 block text-sm font-medium text-text-primary">
                  Nombre
                </label>
                <TextInput
                  id="account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="account-email" className="mb-1 block text-sm font-medium text-text-primary">
                  Email
                </label>
                <TextInput
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm text-text-secondary">
                Rol: {user.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}
              </div>

              {saved && <p className="text-sm text-emerald-700">Datos guardados.</p>}
              {updateMutation.isError && (
                <p className="text-sm text-red-600">No se pudieron guardar los cambios.</p>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateMutation.isPending || !name.trim() || !email.trim()}
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button type="button" variant="secondary" onClick={logout} className="inline-flex items-center justify-center gap-2">
                  <LogOut size={16} />
                  Salir
                </Button>
              </div>
            </form>
          )}
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Palette size={20} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Apariencia</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Usa el tema del dispositivo o fija una preferencia para esta cuenta.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <KeyRound size={20} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Cambiar contraseña</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Usa al menos 8 caracteres para la nueva contraseña.
          </p>

          <form
            className="mt-4 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setPasswordSaved(false);
              setPasswordError(null);

              if (newPassword.length < 8) {
                setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
                return;
              }

              if (newPassword !== confirmPassword) {
                setPasswordError('La confirmación no coincide.');
                return;
              }

              try {
                await passwordMutation.mutateAsync({ currentPassword, newPassword });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordSaved(true);
              } catch {
                setPasswordError('No se pudo cambiar la contraseña. Revisa la contraseña actual.');
              }
            }}
          >
            <div>
              <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-text-primary">
                Contraseña actual
              </label>
              <TextInput
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full"
                autoComplete="current-password"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-text-primary">
                Nueva contraseña
              </label>
              <TextInput
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-text-primary">
                Confirmar contraseña
              </label>
              <TextInput
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full"
                autoComplete="new-password"
                required
              />
            </div>

            {passwordSaved && (
              <p className="text-sm text-emerald-700">Contraseña actualizada.</p>
            )}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={
                passwordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {passwordMutation.isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
