import type { AppMode } from '@app/mode/app-mode';

export function getTourKey(userId: string, mode: AppMode): string {
  return `stelios.tour.v1.${userId}.${mode}`;
}

/**
 * Whether the user already saw (or skipped) the tour for this mode on this device.
 * When storage is unavailable we report it as seen so the tour never loops.
 */
export function hasSeenTour(userId: string, mode: AppMode): boolean {
  try {
    return window.localStorage.getItem(getTourKey(userId, mode)) !== null;
  } catch {
    return true;
  }
}

export function markTourSeen(userId: string, mode: AppMode): void {
  try {
    window.localStorage.setItem(getTourKey(userId, mode), new Date().toISOString());
  } catch {
    // Storage blocked (private mode, quota): nothing to persist.
  }
}
