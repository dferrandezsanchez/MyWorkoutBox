interface AvatarProps {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
};

export default function Avatar({ photoUrl, firstName, lastName, size = 'md' }: AvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const sizeClass = sizeClasses[size];
  const ariaLabel = `Foto de ${firstName} ${lastName}`;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={ariaLabel}
        aria-label={ariaLabel}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className={`${sizeClass} rounded-full bg-surface border border-border text-text-primary font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
