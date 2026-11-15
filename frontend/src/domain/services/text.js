/**
 * Utilidades de texto puras (sin DOM ni APIs). Las usa todo el dominio.
 */

/** ¿Es una letra o un número? (lo que el usuario tiene que escribir). Los espacios y signos se completan solos. */
export const isLetter = (ch) => /[\p{L}\p{N}]/u.test(ch);

/** Letra en minúscula y sin acentos, para comparar sin ser estrictos con mayúsculas o tildes. */
export const baseLetter = (ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Saca signos del principio y del final: "you?" -> "you", "'Cause" -> "Cause". */
export const cleanWord = (token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/** Separa una frase en palabras tal como aparecen (con sus signos). */
export const tokenize = (text) => text.split(/\s+/).filter(Boolean);

/** Clave para guardar una palabra sin duplicados ("You" y "you" son la misma). */
export const wordKey = (word) => word.toLowerCase().replace(/’/g, "'");

/** Frase normalizada para comparar respuestas sin importar mayúsculas ni puntuación. */
export const normalizeSentence = (s) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, '').replace(/\s+/g, ' ').trim();

/** Mezcla un array sin modificar el original. `random` se puede inyectar para tests. */
export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
