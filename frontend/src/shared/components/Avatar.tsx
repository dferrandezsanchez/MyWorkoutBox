interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
};

export default function Avatar({ firstName, lastName, size = 'md' }: AvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const sizeClass = sizeClasses[size];
  const ariaLabel = `Iniciales de ${firstName} ${lastName}`;

  return (
    <div
      aria-label={ariaLabel}
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-display font-bold tracking-wide text-primary-soft`}
    >
      {initials}
    </div>
  );
}
