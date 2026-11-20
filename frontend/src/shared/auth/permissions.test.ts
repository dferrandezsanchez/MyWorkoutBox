import { describe, expect, it } from 'vitest';
import { canManageRoutines } from './permissions';

describe('canManageRoutines', () => {
  it('is always true for admins', () => {
    expect(canManageRoutines({ role: 'ADMIN' })).toBe(true);
    expect(canManageRoutines({ role: 'ADMIN', canManageRoutines: false })).toBe(true);
  });

  it('follows the explicit permission for trainers', () => {
    expect(canManageRoutines({ role: 'TRAINER', canManageRoutines: true })).toBe(true);
    expect(canManageRoutines({ role: 'TRAINER', canManageRoutines: false })).toBe(false);
    expect(canManageRoutines({ role: 'TRAINER' })).toBe(false);
  });

  it('is false without a user', () => {
    expect(canManageRoutines(null)).toBe(false);
    expect(canManageRoutines(undefined)).toBe(false);
  });
});
