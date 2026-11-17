import { describe, expect, it } from 'vitest';
import { describeTimeLeft } from './goal';

const now = new Date('2026-11-17T10:00:00.000Z');

describe('describeTimeLeft', () => {
  it('counts weeks when far and days when close', () => {
    expect(describeTimeLeft('2027-03-17T12:00:00.000Z', now)).toBe('Faltan 17 semanas');
    expect(describeTimeLeft('2026-11-27T12:00:00.000Z', now)).toBe('Faltan 11 días');
    expect(describeTimeLeft('2026-11-18T08:00:00.000Z', now)).toBe('Falta 1 día');
    expect(describeTimeLeft('2026-11-17T10:00:00.000Z', now)).toBe('Es hoy');
    expect(describeTimeLeft('2026-11-01T12:00:00.000Z', now)).toBe('Fecha objetivo superada');
  });
});
