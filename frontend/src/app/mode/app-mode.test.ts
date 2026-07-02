import { describe, expect, it } from 'vitest';
import { getAppMode, getAvailableModes, getModePath } from './app-mode';

describe('app mode', () => {
  it('derives the active mode from the route', () => {
    expect(getAppMode('/admin/clients')).toBe('admin');
    expect(getAppMode('/account?mode=admin')).toBe('admin');
    expect(getAppMode('/trainer/sessions/new')).toBe('trainer');
    expect(getAppMode('/account')).toBe('trainer');
  });

  it('keeps permissions separate from the interface mode', () => {
    expect(getAvailableModes('ADMIN')).toEqual(['admin', 'trainer']);
    expect(getAvailableModes('TRAINER')).toEqual(['trainer']);
    expect(getModePath('admin')).toBe('/admin');
    expect(getModePath('trainer')).toBe('/trainer');
  });
});
