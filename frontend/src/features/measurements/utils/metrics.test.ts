import { describe, expect, it } from 'vitest';
import type { ClientMeasurement } from '@shared/types/api';
import { formatDelta, formatMetric, latestWithDelta, toDateInput } from './metrics';
import { buildChart } from './chartLayout';
import { METRICS } from './metrics';

function measurement(measuredAt: string, values: Partial<ClientMeasurement>): ClientMeasurement {
  return {
    id: measuredAt,
    clientId: 'c1',
    measuredAt: `${measuredAt}T12:00:00.000Z`,
    weight: null,
    bodyFatPercentage: null,
    muscleMass: null,
    notes: null,
    createdAt: measuredAt,
    updatedAt: measuredAt,
    ...values,
  };
}

// Newest first, as the API returns them.
const history = [
  measurement('2026-11-17', { weight: 78.1, muscleMass: 33.2 }),
  measurement('2026-11-03', { weight: 78.5, bodyFatPercentage: 14.2, muscleMass: 33 }),
  measurement('2026-10-20', { weight: 79.4, bodyFatPercentage: 14.6 }),
];

describe('measurement metrics', () => {
  it('formats values and signed deltas in Spanish', () => {
    expect(formatMetric(78.1, 'kg')).toBe('78,1 kg');
    expect(formatMetric(null, 'kg')).toBe('—');
    expect(formatDelta(-0.4)).toBe('−0,4');
    expect(formatDelta(0.25)).toBe('+0,3');
    expect(formatDelta(0)).toBe('±0');
  });

  it('compares the latest value with the previous measurement that has it', () => {
    expect(latestWithDelta(history, 'weight')).toMatchObject({ value: 78.1, delta: -0.4 });
    expect(latestWithDelta(history, 'bodyFatPercentage')).toMatchObject({ value: 14.2, delta: -0.4 });
    expect(latestWithDelta([history[2]], 'weight')).toMatchObject({ value: 79.4, delta: null });
    expect(latestWithDelta([history[2]], 'muscleMass')).toEqual({ value: null, delta: null, measuredAt: null });
  });

  it('builds date inputs', () => {
    expect(toDateInput('2026-11-17T12:00:00.000Z')).toBe('2026-11-17');
    expect(toDateInput(null)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('chart layout', () => {
  const weight = METRICS[0];

  it('stretches the axis to a nearby goal date', () => {
    const chart = buildChart(history, weight, 340, '2026-11-30');
    expect(chart?.goal).toMatchObject({ inRange: true });
    expect(chart?.goal?.x).toBeGreaterThan(chart!.points.at(-1)!.cx);
  });

  it('flags a far goal at the right edge instead of squashing the data', () => {
    const chart = buildChart(history, weight, 340, '2027-06-01');
    expect(chart?.goal).toMatchObject({ inRange: false, x: 340 - 16 });
    expect(chart!.points.at(-1)!.cx).toBeGreaterThan(250);
  });

  it('ignores goals before the first measurement and empty metrics', () => {
    expect(buildChart(history, weight, 340, '2025-01-01')?.goal).toBeNull();
    expect(buildChart([history[2]], METRICS[2], 340, null)).toBeNull();
  });
});
