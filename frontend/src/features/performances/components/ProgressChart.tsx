import type { PerformanceRecord } from '@shared/types/api';

interface ChartPoint {
  id: string;
  date: Date;
  value: number;
  label: string;
}

function getNumericValue(record: PerformanceRecord): number | null {
  if (record.unit === 'kg' && typeof record.weight === 'number') return record.weight;
  if (record.unit === 'repetitions' && typeof record.repetitions === 'number') {
    return record.repetitions;
  }
  if ((record.unit === 'seconds' || record.unit === 'minutes') && typeof record.duration === 'number') {
    return record.duration;
  }
  if (record.unit === 'meters' && typeof record.distance === 'number') return record.distance;

  const numeric = typeof record.value === 'number' ? record.value : Number(record.value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    year: '2-digit',
  }).format(date);
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildSmoothPath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  const commands = [`M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`];
  for (let index = 1; index < coords.length; index += 1) {
    const previous = coords[index - 1];
    const current = coords[index];
    const midX = (previous.x + current.x) / 2;
    commands.push(
      `C ${midX.toFixed(1)} ${previous.y.toFixed(1)}, ${midX.toFixed(1)} ${current.y.toFixed(1)}, ${current.x.toFixed(1)} ${current.y.toFixed(1)}`,
    );
  }
  return commands.join(' ');
}

export default function ProgressChart({ history }: { history: PerformanceRecord[] }) {
  const points: ChartPoint[] = history
    .map((record) => {
      const value = getNumericValue(record);
      if (value == null) return null;
      return {
        id: record.id,
        date: new Date(record.date),
        value,
        label: formatDateLabel(new Date(record.date)),
      };
    })
    .filter((point): point is ChartPoint => point != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length < 2) {
    return (
      <section className="mb-4 rounded-2xl border border-dashed border-white/[0.12] bg-surface/60 p-5 text-center">
        <p className="font-display font-bold text-text-primary">Evolución</p>
        <p className="mt-1 text-sm text-text-secondary">
          Aún no hay suficientes marcas numéricas para dibujar una tendencia.
        </p>
      </section>
    );
  }

  const width = 360;
  const height = 190;
  const paddingLeft = 42;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 30;
  const actualChartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const rawRange = Math.max(1, maxValue - minValue);
  const verticalPadding = rawRange * 0.12;
  const yMin = Math.max(0, minValue - verticalPadding);
  const yMax = maxValue + verticalPadding;
  const valueRange = Math.max(1, yMax - yMin);

  const xFor = (index: number) =>
    paddingLeft +
    (points.length === 1 ? actualChartWidth / 2 : (index / (points.length - 1)) * actualChartWidth);
  const yFor = (value: number) =>
    paddingTop + chartHeight - ((value - yMin) / valueRange) * chartHeight;

  const coords = points.map((point, index) => ({ x: xFor(index), y: yFor(point.value) }));
  const linePath = buildSmoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.value - first.value;
  const yTicks = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <section className="mb-4 min-w-0 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="eyebrow text-xs text-text-muted">Evolución</h2>
          <p className="tabular mt-1.5 text-sm text-text-secondary">
            {points.length} marcas · {first.label} - {last.label}
          </p>
        </div>
        <span
          className={`tabular rounded-full px-3 py-1 font-display text-sm font-bold ring-1 ${
            delta > 0
              ? 'bg-success/10 text-success ring-success/25'
              : delta < 0
                ? 'bg-danger/10 text-danger ring-danger/25'
                : 'bg-white/[0.04] text-text-secondary ring-white/[0.08]'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {formatValue(delta)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfica de evolución de marcas"
        className="h-auto w-full overflow-visible text-primary"
      >
        <defs>
          <linearGradient id="progress-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <text
                x={paddingLeft - 10}
                y={y + 3}
                textAnchor="end"
                className="tabular fill-text-muted font-display text-xs"
              >
                {formatValue(tick)}
              </text>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                className="stroke-white/[0.06]"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
            </g>
          );
        })}

        <path d={areaPath} fill="url(#progress-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />

        {points.map((point, index) => {
          const x = xFor(index);
          const y = yFor(point.value);
          const isLast = index === points.length - 1;
          const showLabel = index === 0 || isLast || point.value === maxValue;
          return (
            <g key={point.id}>
              {isLast && <circle cx={x} cy={y} r="8" fill="currentColor" opacity="0.18" />}
              <circle cx={x} cy={y} r={isLast ? 4.5 : 3.4} fill="currentColor" className="stroke-surface" strokeWidth="2" />
              {showLabel && (
                <text
                  x={x}
                  y={Math.max(12, y - 11)}
                  textAnchor="middle"
                  className={`tabular font-display text-xs font-bold ${isLast ? 'fill-primary-soft' : 'fill-text-primary'}`}
                >
                  {formatValue(point.value)}
                </text>
              )}
            </g>
          );
        })}

        <text x={paddingLeft} y={height - 9} textAnchor="start" className="fill-text-muted font-display text-xs uppercase">
          {first.label}
        </text>
        <text x={width - paddingRight} y={height - 9} textAnchor="end" className="fill-text-muted font-display text-xs uppercase">
          {last.label}
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] pt-4 text-center">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Inicio</p>
          <p className="tabular mt-1.5 font-display text-xl font-bold text-text-primary">{formatValue(first.value)}</p>
        </div>
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Mejor</p>
          <p className="tabular mt-1.5 font-display text-xl font-bold text-text-primary">{formatValue(maxValue)}</p>
        </div>
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Última</p>
          <p className="tabular mt-1.5 font-display text-xl font-bold text-primary-soft">{formatValue(last.value)}</p>
        </div>
      </div>
    </section>
  );
}
