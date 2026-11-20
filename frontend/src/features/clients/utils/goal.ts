const DAY_MS = 24 * 60 * 60 * 1000;

/** Human countdown to the target date: weeks when far, days when close. */
export function describeTimeLeft(goalDate: string, now = new Date()): string {
  const days = Math.ceil((new Date(goalDate).getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return 'Fecha objetivo superada';
  if (days === 0) return 'Es hoy';
  if (days <= 21) return days === 1 ? 'Falta 1 día' : `Faltan ${days} días`;
  return `Faltan ${Math.round(days / 7)} semanas`;
}
