import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUser, removeToken } from '../store/auth';
import { useClients } from '../hooks/useClients';
import ClientCard from '../components/ClientCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce: update debouncedQuery 300ms after inputValue changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: clients, isLoading, isError } = useClients(debouncedQuery || undefined);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // Only show active clients
  const activeClients = clients?.filter((c) => c.status === 'ACTIVE') ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-text-primary">Control de Marcas</h1>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-text-secondary hidden sm:block">
                {user.name || user.email || user.role}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="min-h-[44px] px-4 py-2 text-sm border border-border rounded-md text-text-primary hover:bg-background transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main role="main" className="max-w-5xl mx-auto px-4 py-6">
        {/* Search + actions row */}
        {user?.role === 'ADMIN' && (
          <nav aria-label="Administración" className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/admin/clients')}
              className="min-h-[44px] px-4 py-2 border border-border rounded-md text-text-primary hover:bg-surface transition-colors"
            >
              Gestionar clientes
            </button>
            <button
              onClick={() => navigate('/admin/exercises')}
              className="min-h-[44px] px-4 py-2 border border-border rounded-md text-text-primary hover:bg-surface transition-colors"
            >
              Gestionar ejercicios
            </button>
          </nav>
        )}

        <div className="flex items-center gap-3 mb-6">
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Buscar cliente..."
            aria-label="Buscar cliente"
            className="flex-1 border border-border rounded-md px-3 py-2 min-h-[44px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin/clients')}
              className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors whitespace-nowrap"
            >
              Nuevo cliente
            </button>
          )}
        </div>

        {/* States */}
        {isLoading && (
          <p className="text-text-secondary text-center py-12">Cargando clientes...</p>
        )}

        {isError && (
          <p className="text-red-500 text-center py-12">Error al cargar los clientes</p>
        )}

        {!isLoading && !isError && activeClients.length === 0 && (
          <p className="text-text-secondary text-center py-12">
            No se encontraron clientes
          </p>
        )}

        {!isLoading && !isError && activeClients.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
