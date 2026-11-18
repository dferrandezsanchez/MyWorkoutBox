import { useCallback, useEffect, useState } from 'react';
import type { AppMode } from '@app/mode/app-mode';
import { hasSeenTour, markTourSeen } from '@app/onboarding/tour-storage';

/** Handles the first-visit auto start and manual reopen from the user menu. */
export function useOnboardingTour(userId: string | undefined, mode: AppMode, suppressAutoStart: boolean) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || suppressAutoStart) return;
    if (!hasSeenTour(userId, mode)) setOpen(true);
  }, [userId, mode, suppressAutoStart]);

  const start = useCallback(() => setOpen(true), []);
  const finish = useCallback(() => {
    if (userId) markTourSeen(userId, mode);
    setOpen(false);
  }, [userId, mode]);

  return { open, start, finish };
}
