/** Clave de día "AAAA-MM-DD" en hora local. */
export const dayKey = (date) => date.toLocaleDateString('sv');

/**
 * Días seguidos practicando. Si hoy todavía no practicaste, la racha sigue viva desde ayer.
 * @param {Record<string, {phr:number}>} days
 */
export function computeStreak(days, today = new Date()) {
  const d = new Date(today);
  if (!days[dayKey(d)]?.phr) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]?.phr) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
