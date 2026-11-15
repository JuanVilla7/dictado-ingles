/**
 * Frases habladas vs. frases de pantalla (títulos, carteles, créditos que se ven pero nadie dice).
 *
 * Idea clave: el array de frases NUNCA cambia de largo ni de orden. Las de pantalla se saltean,
 * no se sacan. Así el índice guardado en `prog-<videoId>` (índice de almacenamiento) sigue apuntando
 * a la misma frase, y el número que ve el usuario ("Frase 3/23") se calcula contando solo las habladas.
 */

/** Los objetos sin el campo `spoken` (ej. fixtures viejos) cuentan como hablados. */
export const isSpoken = (cue) => cue.spoken !== false;

/** Primer índice >= from que sea una frase hablada; si no hay, cues.length. */
export function nextSpokenIndex(cues, from) {
  let i = Math.max(0, from);
  while (i < cues.length && !isSpoken(cues[i])) i++;
  return Math.min(i, cues.length);
}

/** Último índice <= from que sea una frase hablada; si no hay, -1. */
export function prevSpokenIndex(cues, from) {
  let i = Math.min(from, cues.length - 1);
  while (i >= 0 && !isSpoken(cues[i])) i--;
  return i;
}

/** Cantidad de frases habladas con índice < upTo. */
export function spokenCount(cues, upTo = cues.length) {
  let n = 0;
  for (let i = 0; i < Math.min(upTo, cues.length); i++) if (isSpoken(cues[i])) n++;
  return n;
}

/** La frase de pantalla que se está viendo en `time` (start <= time < end), o null. */
export const screenCueAt = (cues, time) => cues.find((c) => !isSpoken(c) && c.start <= time && time < c.end) || null;

/**
 * En qué segundo cargar el video para empezar en la frase `index`.
 * Si antes solo hay frases de pantalla, arranca en 0 para que pasen el título y los carteles.
 * La condición `index > 0` hace que los videos propios (sin frases de pantalla) carguen como siempre.
 */
export function startTimeFor(cues, index) {
  if (index > 0 && cues.slice(0, index).every((c) => !isSpoken(c))) return 0;
  return Math.max(0, cues[index].start - 0.2);
}

/** Progreso de un video a partir del índice crudo guardado, contando solo las frases habladas. */
export function videoProgress(cues, savedIndex) {
  const total = spokenCount(cues);
  const done = spokenCount(cues, savedIndex);
  return { done, total, finished: total > 0 && done >= total };
}
