import type { ReactNode } from 'react';
import { BrandMark } from '@shared/components/BrandLogo';

interface OperationalHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Brand illustration: the STELIOS symbol with a rising progress line, the
 * "Evoluciona" idea from the marketing site. Pure SVG, decorative.
 */
function ProgressGraphic() {
  const points: Array<[number, number]> = [
    [12, 150],
    [62, 128],
    [112, 136],
    [162, 98],
    [212, 84],
    [262, 44],
  ];
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const area = `${path} L262 190 L12 190 Z`;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[40%] sm:w-[46%]">
      <BrandMark className="absolute -right-10 top-1/2 h-[150%] w-auto -translate-y-1/2 text-primary/[0.07]" />
      <svg viewBox="0 0 280 200" preserveAspectRatio="xMaxYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="hero-progress-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-progress-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(var(--color-primary-hover))" stopOpacity="1" />
          </linearGradient>
        </defs>
        {[60, 105, 150].map((y) => (
          <line key={y} x1="0" x2="280" y1={y} y2={y} stroke="rgb(255 255 255 / 0.05)" strokeDasharray="3 5" />
        ))}
        <path d={area} fill="url(#hero-progress-fill)" />
        <path d={path} fill="none" stroke="url(#hero-progress-line)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.slice(0, -1).map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="3.5" fill="rgb(var(--color-surface))" stroke="rgb(var(--color-primary) / 0.7)" strokeWidth="2" />
        ))}
        <circle cx="262" cy="44" r="14" fill="rgb(var(--color-primary) / 0.18)" />
        <circle cx="262" cy="44" r="6" fill="rgb(var(--color-primary-hover))" />
      </svg>
    </div>
  );
}

export function OperationalHero({ eyebrow, title, description, action }: OperationalHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/70 via-primary/25 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_0%,rgb(var(--color-primary)/0.10),transparent_60%)]" />
      <ProgressGraphic />
      <div className="relative z-10 p-5 sm:p-7">
        <div className="max-w-[60%] pr-2 sm:max-w-[56%]">
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-6 bg-primary/60" />
            {eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
        {action && <div className="mt-6 sm:max-w-[56%]">{action}</div>}
      </div>
    </section>
  );
}
