import { useNavigate } from 'react-router-dom';
import type { Client } from '../types/api';
import Avatar from './Avatar';
import { StatusBadge } from './ui';

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
      className="group flex min-h-[64px] w-full cursor-pointer items-center gap-3 border-b border-border bg-elevated px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/5"
      aria-label={`Ver perfil de ${client.firstName} ${client.lastName}`}
    >
      <Avatar
        photoUrl={client.photoUrl}
        firstName={client.firstName}
        lastName={client.lastName}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary group-hover:text-primary">
          {client.firstName} {client.lastName}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">Perfil y marcas</p>
      </div>

      <StatusBadge status={client.status} />
      <span className="text-text-muted transition-colors group-hover:text-primary">›</span>
    </div>
  );
}
