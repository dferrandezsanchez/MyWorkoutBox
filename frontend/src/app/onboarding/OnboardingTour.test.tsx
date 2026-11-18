import { render, screen } from '@testing-library/react';
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

describe('OnboardingTour', () => {
  afterEach(() => window.localStorage.clear());

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
});
