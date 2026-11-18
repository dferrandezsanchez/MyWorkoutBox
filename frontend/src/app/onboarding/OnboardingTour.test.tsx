import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { AppMode } from '@app/mode/app-mode';
import { OnboardingTour } from './OnboardingTour';
import { useOnboardingTour } from './useOnboardingTour';
import { TOUR_STEPS } from './tour-steps';
import { hasSeenTour, markTourSeen } from './tour-storage';

function Harness({ mode = 'trainer', suppress = false }: { mode?: AppMode; suppress?: boolean }) {
  const tour = useOnboardingTour('user-1', mode, suppress);
  return (
    <>
      <button type="button" onClick={tour.start}>Abrir guía</button>
      <OnboardingTour mode={mode} open={tour.open} onFinish={tour.finish} />
    </>
  );
}

/** Adds a `data-tour` anchor with a fake layout box (jsdom does no layout). */
function addAnchor(target: string, box: { left: number; top: number; width: number; height: number }, visible = true) {
  const element = document.createElement('button');
  element.dataset.tour = target;
  element.getClientRects = () => (visible ? [box] : []) as unknown as DOMRectList;
  element.getBoundingClientRect = () => box as DOMRect;
  document.body.appendChild(element);
  return element;
}

function cardPosition() {
  const card = screen.getByRole('dialog');
  return { left: card.style.left, top: card.style.top };
}

describe('OnboardingTour', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.querySelectorAll('[data-tour]').forEach((element) => element.remove());
  });

  it('starts automatically on the first visit and walks through every step', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const steps = TOUR_STEPS.trainer;
    expect(screen.getByRole('dialog', { name: steps[0].title })).toBeInTheDocument();
    expect(screen.getByText(`1 de ${steps.length}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Atrás' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('dialog', { name: steps[1].title })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(screen.getByRole('dialog', { name: steps[0].title })).toBeInTheDocument();

    for (let index = 1; index < steps.length; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(screen.getByRole('dialog', { name: steps[steps.length - 1].title })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Empezar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasSeenTour('user-1', 'trainer')).toBe(true);
  });

  it('does not start again once seen, but can be reopened manually', async () => {
    const user = userEvent.setup();
    markTourSeen('user-1', 'trainer');
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir guía' }));
    expect(screen.getByRole('dialog', { name: TOUR_STEPS.trainer[0].title })).toBeInTheDocument();
  });

  it('marks the tour as seen when skipped or closed with Escape', async () => {
    const user = userEvent.setup();
    const view = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Saltar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasSeenTour('user-1', 'trainer')).toBe(true);

    view.unmount();
    render(<Harness mode="admin" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasSeenTour('user-1', 'admin')).toBe(true);
  });

  it('shows admin steps in admin mode', () => {
    render(<Harness mode="admin" />);
    expect(screen.getByText(`1 de ${TOUR_STEPS.admin.length}`)).toBeInTheDocument();
  });

  it('does not auto start while suppressed (e.g. during a live training session)', () => {
    render(<Harness suppress />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasSeenTour('user-1', 'trainer')).toBe(false);
  });

  it('places the card beside the visible anchor: right of the sidebar, below the header, above the bottom nav', async () => {
    const user = userEvent.setup();
    addAnchor('trainer-home', { left: 0, top: 0, width: 0, height: 0 }, false);
    addAnchor('trainer-home', { left: 16, top: 200, width: 240, height: 46 });
    addAnchor('trainer-train', { left: 400, top: 720, width: 100, height: 40 });
    addAnchor('user-menu', { left: 900, top: 10, width: 100, height: 44 });
    render(<Harness />);

    expect(cardPosition()).toEqual({ left: '', top: '' });
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(cardPosition()).toEqual({ left: '276px', top: '223px' });

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(cardPosition()).toEqual({ left: '270px', top: '700px' });

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('dialog', { name: TOUR_STEPS.trainer[4].title })).toBeInTheDocument();
    expect(cardPosition()).toEqual({ left: '648px', top: '74px' });

    fireEvent(window, new Event('resize'));
    expect(cardPosition()).toEqual({ left: '648px', top: '74px' });
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('dialog', { name: TOUR_STEPS.trainer[3].title })).toBeInTheDocument();
  });
});
