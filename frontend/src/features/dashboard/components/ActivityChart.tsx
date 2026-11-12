interface ActivityDay {
  date: string;
  sessions: number;
  series: number;
}

const WIDTH = 640;
const HEIGHT = 200;
const PADDING_LEFT = 28;
const PADDING_BOTTOM = 24;
const GAP = 4;

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Daily series for the period as bars; today is highlighted. */
export function ActivityChart({ days }: { days: ActivityDay[] }) {
  const max = Math.max(...days.map((day) => day.series), 1);
  const ticks = [max, Math.round(max / 2), 0];
  const chartWidth = WIDTH - PADDING_LEFT;
  const chartHeight = HEIGHT - PADDING_BOTTOM;
  const barWidth = (chartWidth - GAP * (days.length - 1)) / days.length;
  const total = days.reduce((sum, day) => sum + day.series, 0);
  const activeDays = days.filter((day) => day.sessions > 0 || day.series > 0).length;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={`${total} series registradas en ${days.length} días, con actividad en ${activeDays} de ellos.`}>
        {ticks.map((tick) => {
          const y = chartHeight - (tick / max) * (chartHeight - 8);
          return (
            <g key={tick}>
              <line x1={PADDING_LEFT} x2={WIDTH} y1={y} y2={y} className="stroke-white/[0.06]" strokeDasharray={tick === 0 ? undefined : '3 4'} />
              <text x={PADDING_LEFT - 8} y={y + 4} textAnchor="end" className="fill-text-muted font-display text-[11px] tabular">{tick}</text>
            </g>
          );
        })}
        {days.map((day, index) => {
          const height = day.series === 0 ? 2 : Math.max((day.series / max) * (chartHeight - 8), 4);
          const x = PADDING_LEFT + index * (barWidth + GAP);
          const isToday = index === days.length - 1;
          return (
            <g key={day.date}>
              <rect
                x={x}
                y={chartHeight - height}
                width={barWidth}
                height={height}
                rx={Math.min(3, barWidth / 2)}
                className={day.series === 0 ? 'fill-white/[0.06]' : isToday ? 'fill-primary' : 'fill-primary/40'}
              >
                <title>{`${formatDay(day.date)}: ${day.series} series · ${day.sessions} sesiones`}</title>
              </rect>
              {(index % 7 === 0 || isToday) && (
                <text x={x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle" className={`font-display text-[11px] ${isToday ? 'fill-primary-soft' : 'fill-text-muted'}`}>
                  {isToday ? 'Hoy' : formatDay(day.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
