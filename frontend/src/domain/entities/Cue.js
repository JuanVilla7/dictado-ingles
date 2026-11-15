/**
 * Cue = una frase del video con sus tiempos (en segundos).
 *
 * `bStart`/`bEnd` son los límites del "bloque" real de la transcripción. Cuando una transcripción
 * trae un solo tiempo cada ~10 s y la dividimos en oraciones, `start`/`end` son estimados, pero
 * `bStart`/`bEnd` son confiables: el video nunca se pausa antes de `bEnd`.
 */
export function createCue({ start, end, text, bStart = start, bEnd = end }) {
  if (!(end >= start)) throw new Error(`Cue inválido: end (${end}) < start (${start})`);
  return Object.freeze({ start, end, text, bStart, bEnd });
}

/** Los videos de la biblioteca guardan cada frase como [inicio, fin, texto]. */
export const cueFromTuple = ([start, end, text]) => createCue({ start, end, text });
