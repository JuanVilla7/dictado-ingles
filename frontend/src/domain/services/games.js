import { normalizeSentence, shuffle, tokenize } from './text.js';
import { isSpoken } from './spoken.js';

export const ROUNDS_PER_GAME = 10;

const LIMITS = { listen: [4, 14], order: [4, 11] };

/** Frases que sirven para un juego: ni muy cortas ni muy largas, y solo habladas (sin títulos ni créditos). */
export function eligibleRounds(videos, type) {
  const [min, max] = LIMITS[type];
  const pool = [];
  for (const video of videos) {
    for (const cue of video.cues) {
      const n = tokenize(cue.text).length;
      if (n >= min && n <= max && isSpoken(cue)) pool.push({ video, cue, words: n });
    }
  }
  return pool;
}

/** Orden mezclado de 0..n-1 que nunca sea el orden correcto (si n > 1). */
export function scrambledOrder(n, random = Math.random) {
  const identity = [...Array(n).keys()];
  if (n < 2) return identity;
  let order;
  do order = shuffle(identity, random); while (order.every((x, i) => x === i));
  return order;
}

/** ¿Las palabras elegidas forman la frase? (no importan mayúsculas ni signos) */
export const isCorrectOrder = (picked, tokens) => normalizeSentence(picked.join(' ')) === normalizeSentence(tokens.join(' '));

export function resultMessage(score, total) {
  if (score === total) return '¡Perfecto! 🏆';
  if (score >= total * 0.7) return '¡Muy bien! 💪';
  if (score >= total * 0.4) return 'Vas mejorando 🙂';
  return 'A seguir practicando 🎧';
}
