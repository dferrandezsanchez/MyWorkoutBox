import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTourKey, hasSeenTour, markTourSeen } from './tour-storage';

describe('tour storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('tracks the tour per user and per mode', () => {
    expect(hasSeenTour('user-1', 'trainer')).toBe(false);
    markTourSeen('user-1', 'trainer');

    expect(hasSeenTour('user-1', 'trainer')).toBe(true);
    expect(hasSeenTour('user-1', 'admin')).toBe(false);
    expect(hasSeenTour('user-2', 'trainer')).toBe(false);
    expect(window.localStorage.getItem(getTourKey('user-1', 'trainer'))).not.toBeNull();
  });

  it('treats blocked storage as already seen so the tour never loops', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(hasSeenTour('user-1', 'trainer')).toBe(true);
    expect(() => markTourSeen('user-1', 'trainer')).not.toThrow();
  });
});
