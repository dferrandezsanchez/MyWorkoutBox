/** Tiny trend line for KPI cards. Decorative: the number next to it carries the meaning. */
export function Sparkline({ values, className = 'h-8 w-24' }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  const points = values.map((value, index) => `${(index * step).toFixed(2)},${(30 - (value / max) * 26).toFixed(2)}`);
  const area = `0,32 ${points.join(' ')} 100,32`;

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      <polygon points={area} className="fill-primary/10" />
      <polyline points={points.join(' ')} fill="none" className="stroke-primary" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
