import { useEffect, useRef, useState } from 'react';
import type { ClientMeasurement } from '@shared/types/api';
import { METRICS, formatDay, formatMetric, type MetricKey } from '@features/measurements/utils/metrics';
import { CHART_HEIGHT as HEIGHT, CHART_PADDING as PAD, buildChart } from '@features/measurements/utils/chartLayout';

interface MeasurementChartProps {
  /** Newest first, as returned by the API. */
  measurements: ClientMeasurement[];
  goalDate?: string | null;
}

const FALLBACK_WIDTH = 340;

/** Width of an element in CSS pixels, so the SVG is drawn 1:1 and text keeps its real size on phones. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => setWidth(Math.max(Math.round(element.getBoundingClientRect().width), 240));
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/** Evolution of one metric at a time, with the client's target date marked. */
export function MeasurementChart({ measurements, goalDate }: MeasurementChartProps) {
  const available = METRICS.filter((metric) => measurements.some((measurement) => measurement[metric.key] != null));
  const [selected, setSelected] = useState<MetricKey>(available[0]?.key ?? 'weight');
  const metric = available.find((item) => item.key === selected) ?? available[0];
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const chart = metric ? buildChart(measurements, metric, width, goalDate) : null;
  if (!metric || !chart) return null;

  const path = chart.points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.cx.toFixed(1)} ${point.cy.toFixed(1)}`).join(' ');
  const area = `${path} L${chart.points[chart.points.length - 1].cx.toFixed(1)} ${chart.baseline} L${chart.points[0].cx.toFixed(1)} ${chart.baseline} Z`;
  const latest = chart.points[chart.points.length - 1];
  const firstPoint = chart.points[0];
  const goalLabel = chart.goal ? `Objetivo · ${formatDay(chart.goal.date, { day: 'numeric', month: 'short' })}` : '';
  const goalSummary = chart.goal ? `; fecha objetivo ${formatDay(chart.goal.date)}` : '';
  const summary = `${metric.label}: de ${formatMetric(firstPoint.value, metric.unit)} el ${formatDay(firstPoint.date)} a ${formatMetric(latest.value, metric.unit)} el ${formatDay(latest.date)}${goalSummary}.`;
  const latestLabelAnchor = latest.cx > width - 60 ? 'end' : 'middle';

  return (
    <div>
      {available.length > 1 && (
        <div role="tablist" aria-label="Medida a mostrar" className="mb-4 flex gap-2 overflow-x-auto">
          {available.map((item) => {
            const active = item.key === metric.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelected(item.key)}
                className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 focus-ring ${
                  active ? 'border-primary bg-primary text-primary-contrast' : 'border-white/[0.11] text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      )}

      <figure ref={ref} className="m-0">
        <svg viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} className="block h-auto w-full" role="img" aria-label={summary}>
          <defs>
            <linearGradient id="measurement-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line x1={PAD.left} x2={width - PAD.right} y1={tick.y} y2={tick.y} className="stroke-white/[0.06]" strokeDasharray="3 5" />
              <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" className="tabular fill-text-muted font-display text-[11px]">
                {Number.isInteger(tick.value) ? tick.value : tick.value.toFixed(1)}
              </text>
            </g>
          ))}

          {chart.goal?.inRange && (
            <g>
              <line x1={chart.goal.x} x2={chart.goal.x} y1={PAD.top - 8} y2={chart.baseline} className="stroke-warning/70" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x={Math.min(chart.goal.x, width - PAD.right)} y={PAD.top - 14} textAnchor="end" className="fill-warning font-display text-[12px] font-semibold">
                {goalLabel}
              </text>
            </g>
          )}
          {chart.goal && !chart.goal.inRange && (
            <g>
              <line x1={chart.goal.x} x2={chart.goal.x} y1={PAD.top - 8} y2={chart.baseline} className="stroke-warning/50" strokeDasharray="2 4" strokeWidth="1.5" />
              <text x={chart.goal.x} y={PAD.top - 14} textAnchor="end" className="fill-warning font-display text-[12px] font-semibold">
                {goalLabel} →
              </text>
            </g>
          )}

          {chart.points.length > 1 && <path d={area} fill="url(#measurement-area)" />}
          {chart.points.length > 1 && <path d={path} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

          {chart.points.map((point, index) => {
            const isLatest = index === chart.points.length - 1;
            return (
              <g key={point.date}>
                {isLatest && <circle cx={point.cx} cy={point.cy} r="11" className="fill-primary/20" />}
                <circle cx={point.cx} cy={point.cy} r={isLatest ? 5 : 3.5} className={isLatest ? 'fill-primary-hover' : 'fill-surface stroke-primary'} strokeWidth="2">
                  <title>{`${formatDay(point.date)}: ${formatMetric(point.value, metric.unit)}`}</title>
                </circle>
              </g>
            );
          })}

          <text x={latest.cx} y={latest.cy - 16} textAnchor={latestLabelAnchor} className="tabular fill-text-primary font-display text-[13px] font-bold">
            {formatMetric(latest.value, metric.unit)}
          </text>
          <text x={firstPoint.cx} y={HEIGHT - 6} textAnchor="start" className="fill-text-muted font-display text-[11px]">
            {formatDay(firstPoint.date, { day: 'numeric', month: 'short' })}
          </text>
          {chart.points.length > 1 && (
            <text x={latest.cx} y={HEIGHT - 6} textAnchor={latestLabelAnchor === 'end' ? 'end' : 'middle'} className="fill-text-muted font-display text-[11px]">
              {formatDay(latest.date, { day: 'numeric', month: 'short' })}
            </text>
          )}
        </svg>
      </figure>
    </div>
  );
}
