import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { AppMode } from '@app/mode/app-mode';
import { Button } from '@shared/components/ui';
import { TOUR_STEPS } from '@app/onboarding/tour-steps';

const SPOTLIGHT_PADDING = 6;
const GAP = 14;
const EDGE = 16;
const MAX_CARD_WIDTH = 360;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Returns the first visible element for a `data-tour` anchor (sidebar on desktop, bottom nav on mobile). */
function findVisibleTarget(target: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const element of candidates) {
    if (element.getClientRects().length > 0) return element;
  }
  return null;
}

function toRect(element: HTMLElement): Rect {
  const box = element.getBoundingClientRect();
  return {
    top: box.top - SPOTLIGHT_PADDING,
    left: box.left - SPOTLIGHT_PADDING,
    width: box.width + SPOTLIGHT_PADDING * 2,
    height: box.height + SPOTLIGHT_PADDING * 2,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Places the card beside the spotlight: right of it (sidebar), below it (header) or above it (bottom nav). */
function placeCard(rect: Rect, cardWidth: number, cardHeight: number): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const rightSpace = viewportWidth - (rect.left + rect.width);
  const belowSpace = viewportHeight - (rect.top + rect.height);

  if (rightSpace >= cardWidth + GAP + EDGE && rect.left < viewportWidth / 3) {
    return {
      left: rect.left + rect.width + GAP,
      top: clamp(rect.top + rect.height / 2 - cardHeight / 2, EDGE, viewportHeight - cardHeight - EDGE),
    };
  }

  const left = clamp(rect.left + rect.width / 2 - cardWidth / 2, EDGE, viewportWidth - cardWidth - EDGE);
  if (belowSpace >= cardHeight + GAP + EDGE) {
    return { left, top: rect.top + rect.height + GAP };
  }
  return { left, top: Math.max(EDGE, rect.top - cardHeight - GAP) };
}

interface OnboardingTourProps {
  mode: AppMode;
  open: boolean;
  onFinish: () => void;
}

export function OnboardingTour({ mode, open, onFinish }: OnboardingTourProps) {
  const steps = TOUR_STEPS[mode];
  const [index, setIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [cardStyle, setCardStyle] = useState<CSSProperties | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, mode]);

  const measure = useCallback(() => {
    const element = step.target ? findVisibleTarget(step.target) : null;
    if (!element) {
      setSpotlight(null);
      setCardStyle(null);
      return;
    }
    const rect = toRect(element);
    const cardWidth = Math.min(MAX_CARD_WIDTH, window.innerWidth - EDGE * 2);
    const cardHeight = cardRef.current?.offsetHeight ?? 200;
    setSpotlight(rect);
    setCardStyle({ ...placeCard(rect, cardWidth, cardHeight), width: cardWidth });
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFinish();
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(current + 1, steps.length - 1));
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(current - 1, 0));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onFinish, steps.length]);

  if (!open) return null;

  const next = () => (isLast ? onFinish() : setIndex((current) => current + 1));

  return (
    <div className="fixed inset-0 z-[80]" data-testid="onboarding-tour">
      {spotlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl ring-2 ring-primary/70 transition-all duration-200 ease-out motion-reduce:transition-none"
          style={{ ...spotlight, boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)' }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={`fixed rounded-3xl border border-white/[0.08] bg-surface p-5 shadow-panel outline-none transition-[top,left] duration-200 ease-out motion-reduce:transition-none ${
          cardStyle ? '' : 'left-1/2 top-1/2 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2'
        }`}
        style={cardStyle ?? undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow text-xs text-text-muted">
            {index + 1} de {steps.length}
          </p>
          <button
            type="button"
            onClick={onFinish}
            aria-label="Cerrar guía"
            className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id={titleId} className="mt-1 font-display text-lg font-bold text-text-primary">
          {step.title}
        </h2>
        <p id={bodyId} className="mt-1.5 text-sm text-text-secondary">
          {step.body}
        </p>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((item, dotIndex) => (
            <span
              key={item.title + dotIndex}
              className={`h-1.5 rounded-full transition-all duration-200 motion-reduce:transition-none ${
                dotIndex === index ? 'w-5 bg-primary' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {isLast ? (
            <span />
          ) : (
            <Button variant="ghost" className="px-3" onClick={onFinish}>
              Saltar
            </Button>
          )}
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="secondary" onClick={() => setIndex((current) => current - 1)}>
                Atrás
              </Button>
            )}
            <Button variant="primary" onClick={next}>
              {isLast ? 'Empezar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
