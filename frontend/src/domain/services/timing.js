/**
 * Reglas de cuándo pausar y qué repetir durante el dictado.
 * Son funciones puras: reciben el tiempo actual y la frase, y deciden.
 */

/** Segundos extra después del final de la frase antes de pausar (para no cortar la última palabra). */
export const PAUSE_MARGIN = 0.8;

/**
 * ¿Hay que pausar el video para que el usuario escriba?
 * `allowUntil`: si el usuario dio play a mano, lo dejamos seguir hasta ese momento.
 */
export function shouldAutoPause({ time, cue, lineDone, allowUntil = 0, replaying = false }) {
  if (lineDone || replaying) return false;
  return time >= Math.max(cue.bEnd, allowUntil) + PAUSE_MARGIN;
}

/**
 * Qué tramo reproducir al apretar Tab: la frase con 1 s de margen,
 * pero nunca menos de `minSeconds` (ej. 5 s) ni fuera de su bloque real.
 */
export function replayWindow(cue, minSeconds) {
  const end = Math.min(cue.bEnd, cue.end + 1) + 0.3;
  let start = Math.max(cue.bStart - 0.3, cue.start - 1);
  if (end - start < minSeconds) start = end - minSeconds;
  return { start: Math.max(0, start), end };
}

/** Si el usuario da play a mano, puede seguir hasta el final del próximo bloque. */
export function manualPlayLimit(cues, time) {
  const next = cues.find((c) => c.bEnd > time + 0.5);
  return next ? next.bEnd : Infinity;
}

/** Sin pausas automáticas: ¿qué frase está sonando ahora? (nunca retrocede) */
export function cueIndexAt(cues, time, fromIndex) {
  let j = fromIndex;
  while (j + 1 < cues.length && time >= cues[j + 1].start) j++;
  return j;
}
