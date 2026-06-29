import { useNavigate } from 'react-router-dom';
import type { Client } from '@shared/types/api';
import Avatar from '@shared/components/Avatar';
import { StatusBadge } from '@shared/components/ui';

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
      className="group flex min-h-[70px] w-full cursor-pointer items-center gap-3 border-b border-border/70 bg-elevated/75 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/8 focus-ring"
      aria-label={`Ver perfil de ${client.firstName} ${client.lastName}`}
    >
      <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary group-hover:text-primary">
          {client.firstName} {client.lastName}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">Perfil y marcas</p>
      </div>

      <div className="hidden shrink-0 min-[380px]:block">
        <StatusBadge status={client.status} />
      </div>
      <span className="shrink-0 text-text-muted transition-colors group-hover:text-primary">›</span>
    </div>
  );
}
