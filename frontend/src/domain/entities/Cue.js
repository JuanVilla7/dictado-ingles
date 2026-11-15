/**
 * Cue = una frase del video con sus tiempos (en segundos).
 *
 * `bStart`/`bEnd` son los límites del "bloque" real de la transcripción. Cuando una transcripción
 * trae un solo tiempo cada ~10 s y la dividimos en oraciones, `start`/`end` son estimados, pero
 * `bStart`/`bEnd` son confiables: el video nunca se pausa antes de `bEnd`.
 *
 * `spoken`: false si es texto que solo aparece en pantalla (títulos, carteles, créditos) y nadie lo dice.
 * Por defecto es true, así el parser de transcripciones sigue marcando todo como hablado.
 */
export function createCue({ start, end, text, bStart = start, bEnd = end, spoken = true }) {
  if (!(end >= start)) throw new Error(`Cue inválido: end (${end}) < start (${start})`);
  return Object.freeze({ start, end, text, bStart, bEnd, spoken });
}

/** Valor del 4º elemento de la tupla → ¿se dice en voz alta? */
const KINDS = { undefined: true, screen: false };

/**
 * Los videos de la biblioteca guardan cada frase como [inicio, fin, texto] o [inicio, fin, texto, "screen"].
 * Un 4º elemento desconocido tira error: así un error de tipeo en videos.json salta en los tests.
 */
export function cueFromTuple([start, end, text, kind]) {
  const key = String(kind);
  if (!Object.hasOwn(KINDS, key)) throw new Error(`Tipo de frase desconocido: "${kind}" en "${text}"`);
  return createCue({ start, end, text, spoken: KINDS[key] });
}
