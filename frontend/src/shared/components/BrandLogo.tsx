import { BRAND } from '@shared/config/branding';

/** STELIOS "S" symbol, same geometry as the marketing site and the favicon. */
export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="202 360 1528 1210" className={className} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M790 360H1730L1528 652H855L742 768L806 836H1300L1497 1030Q1522 1110 1497 1200L1190 1535Q1160 1570 1135 1570H202L412 1278H1068L1180 1152L1135 1095H638L445 900Q418 790 478 655Z"
      />
    </svg>
  );
}

export function BrandLogo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: { mark: 'h-4 w-5', text: 'text-sm tracking-[0.22em]' },
    md: { mark: 'h-5 w-6', text: 'text-base tracking-[0.24em]' },
    lg: { mark: 'h-8 w-10', text: 'text-2xl tracking-[0.26em]' },
  }[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className={`${sizes.mark} text-primary`} />
      <span className={`font-display font-bold text-text-primary ${sizes.text}`}>{BRAND.name}</span>
    </span>
  );
}
