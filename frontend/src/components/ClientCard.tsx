import { useNavigate } from 'react-router-dom';
import type { Client } from '../types/api';
import Avatar from './Avatar';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/clients/${client.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="bg-surface border border-border rounded-lg p-4 cursor-pointer min-w-full min-h-[44px] flex items-center gap-3 hover:border-primary transition-colors"
      aria-label={`Ver perfil de ${client.firstName} ${client.lastName}`}
    >
      <Avatar
        photoUrl={client.photoUrl}
        firstName={client.firstName}
        lastName={client.lastName}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium truncate">
          {client.firstName} {client.lastName}
        </p>
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
            client.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {client.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  );
}
