import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Client } from '@shared/types/api';
import Avatar from '@shared/components/Avatar';
import { StatusBadge } from '@shared/components/ui';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    void navigate(`/clients/${client.id}`);
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
      className="group flex min-h-[72px] w-full cursor-pointer items-center gap-3 border-b border-white/[0.06] bg-surface px-4 py-3 text-left transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/[0.03] focus-ring"
      aria-label={`Ver perfil de ${client.firstName} ${client.lastName}`}
    >
      <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-text-primary">
          {client.firstName} {client.lastName}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">Perfil y marcas</p>
      </div>

      <div className="hidden shrink-0 min-[380px]:block">
        <StatusBadge status={client.status} />
      </div>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" />
    </div>
  );
}
