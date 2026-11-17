import type { ClientMeasurement } from '@shared/types/api';
import type { METRICS } from '@features/measurements/utils/metrics';

type Metric = (typeof METRICS)[number];

export const CHART_HEIGHT = 200;
export const CHART_PADDING = { top: 30, right: 16, bottom: 26, left: 36 };
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_SPAN_DAYS = 14;
/** The axis only stretches to the goal when it is this close (as a share of the measured span); farther goals are flagged at the edge. */
const GOAL_STRETCH_RATIO = 0.6;

export interface ChartGoal {
  x: number;
  date: string;
  /** False when the goal is beyond the plotted range and is flagged at the right edge. */
  inRange: boolean;
}

/** Pure layout of the chart for a given pixel width. Exported for tests. */
export function buildChart(measurements: ClientMeasurement[], metric: Metric, width: number, goalDate?: string | null) {
  const points = measurements
    .filter((measurement) => measurement[metric.key] != null)
    .map((measurement) => ({ time: new Date(measurement.measuredAt).getTime(), value: measurement[metric.key] as number, date: measurement.measuredAt }))
    .sort((a, b) => a.time - b.time);
  if (points.length === 0) return null;

  const first = points[0].time;
  const last = points[points.length - 1].time;
  const span = Math.max(last - first, MIN_SPAN_DAYS * DAY_MS);
  const goalTime = goalDate ? new Date(goalDate).getTime() : null;
  const goalAfterStart = goalTime !== null && goalTime > first;
  const goalInRange = goalAfterStart && goalTime! <= last + span * GOAL_STRETCH_RATIO;
  const end = Math.max(goalInRange ? goalTime! : last, first + span);

  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.25, 1);
  const min = Math.floor((rawMin - padding) * 2) / 2;
  const max = Math.ceil((rawMax + padding) * 2) / 2;
  // Reserve room on the right for the edge flag when the goal is far away.
  const right = goalAfterStart && !goalInRange ? CHART_PADDING.right + 18 : CHART_PADDING.right;

  const x = (time: number) => CHART_PADDING.left + ((time - first) / (end - first)) * (width - CHART_PADDING.left - right);
  const y = (value: number) => CHART_PADDING.top + (1 - (value - min) / (max - min)) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);

  let goal: ChartGoal | null = null;
  if (goalAfterStart) goal = goalInRange ? { x: x(goalTime!), date: goalDate!, inRange: true } : { x: width - CHART_PADDING.right, date: goalDate!, inRange: false };

  return {
    points: points.map((point) => ({ ...point, cx: x(point.time), cy: y(point.value) })),
    ticks: [max, (max + min) / 2, min].map((value) => ({ value, y: y(value) })),
    goal,
    baseline: CHART_HEIGHT - CHART_PADDING.bottom,
  };
}
