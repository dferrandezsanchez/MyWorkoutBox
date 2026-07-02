import type { ReactNode } from 'react';
import trainerDumbbell from '../../assets/trainer-dumbbell.webp';

interface OperationalHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function OperationalHero({ eyebrow, title, description, action }: OperationalHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-primary/25 bg-surface shadow-[0_22px_60px_rgba(var(--color-primary-soft)/0.12)]">
      <div className="absolute inset-x-0 top-0 h-px bg-primary/70" />
      <div className="relative z-10 p-5 sm:p-6">
        <div className="max-w-[76%] pr-4 sm:max-w-[62%]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
        {action && <div className="mt-5 sm:max-w-[62%]">{action}</div>}
      </div>
      <div className="pointer-events-none absolute -right-5 top-8 z-0 h-36 w-44 sm:right-3 sm:top-6 sm:h-40 sm:w-56">
        <img src={trainerDumbbell} alt="" className="h-full w-full object-contain opacity-75 [filter:grayscale(1)_contrast(1.35)_brightness(0.3)_drop-shadow(0_18px_24px_rgb(0_0_0/0.7))]" />
        <span
          className="absolute inset-0 bg-primary opacity-25 mix-blend-color"
          style={{ WebkitMaskImage: `url(${trainerDumbbell})`, maskImage: `url(${trainerDumbbell})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }}
        />
      </div>
    </section>
  );
}
