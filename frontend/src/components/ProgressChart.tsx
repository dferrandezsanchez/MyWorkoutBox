import type { PerformanceRecord } from '../types/api';

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
      <section className="mb-4 rounded-md border border-dashed border-border bg-white p-4 text-center">
        <p className="font-medium text-[#343434]">Evolución</p>
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
    <section className="mb-4 rounded-md border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#282828]">Evolución</h2>
          <p className="text-sm text-text-secondary">
            {points.length} marcas · {first.label} - {last.label}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            delta > 0
              ? 'bg-emerald-50 text-emerald-700'
              : delta < 0
                ? 'bg-red-50 text-red-600'
                : 'bg-gray-100 text-gray-600'
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
        className="h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient id="progress-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ED702D" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ED702D" stopOpacity="0.02" />
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
                className="fill-[#8A8A8A] text-[9px]"
              >
                {formatValue(tick)}
              </text>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="#ECECEC"
                strokeWidth="1"
              />
            </g>
          );
        })}

        <path d={areaPath} fill="url(#progress-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#ED702D"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />

        {points.map((point, index) => {
          const x = xFor(index);
          const y = yFor(point.value);
          const showLabel = index === 0 || index === points.length - 1 || point.value === maxValue;
          return (
            <g key={point.id}>
              <circle cx={x} cy={y} r="3.4" fill="#ED702D" stroke="#FFFFFF" strokeWidth="2" />
              {showLabel && (
                <>
                  <text
                    x={x}
                    y={Math.max(12, y - 9)}
                    textAnchor="middle"
                    className="fill-[#343434] text-[10px] font-semibold"
                  >
                    {formatValue(point.value)}
                  </text>
                </>
              )}
            </g>
          );
        })}

        <text x={paddingLeft} y={height - 9} textAnchor="start" className="fill-[#8A8A8A] text-[9px]">
          {first.label}
        </text>
        <text x={width - paddingRight} y={height - 9} textAnchor="end" className="fill-[#8A8A8A] text-[9px]">
          {last.label}
        </text>
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-[#FAFAFA] p-3 text-center text-xs text-text-secondary">
        <div className="border-r border-border last:border-r-0">
          <p>Inicio</p>
          <p className="mt-1 font-semibold text-[#343434]">{formatValue(first.value)}</p>
        </div>
        <div className="border-r border-border last:border-r-0">
          <p>Mejor</p>
          <p className="mt-1 font-semibold text-[#343434]">{formatValue(maxValue)}</p>
        </div>
        <div>
          <p>Última</p>
          <p className="mt-1 font-semibold text-[#343434]">{formatValue(last.value)}</p>
        </div>
      </div>
    </section>
  );
}
