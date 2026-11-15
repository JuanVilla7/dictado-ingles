import { cleanWord, shuffle } from './text.js';

/**
 * Pares de palabras que suenan parecido o se confunden al escuchar.
 * Se usan para armar opciones incorrectas "creíbles" en el juego ¿Qué escuchaste?
 */
export const MINIMAL_PAIRS = [
  ['can', "can't"], ['is', 'was'], ['are', 'were'], ['he', 'she'], ['his', 'her'], ['this', 'that'],
  ['these', 'those'], ['a', 'the'], ['in', 'on'], ['do', 'did'], ["don't", "didn't"], ['will', 'would'],
  ['would', 'could'], ['there', 'here'], ['then', 'than'], ['have', 'had'], ['me', 'my'], ['him', 'them'],
  ['some', 'any'], ['much', 'many'], ['your', 'our'], ["it's", 'it was'], ["I'm", 'I was'], ['know', 'no'],
  ['want', "won't"], ['and', 'an'], ['to', 'the'], ['very', 'really'], ['all', 'old'], ['one', 'own'],
  ['live', 'leave'], ['ever', 'never'], ['at', 'in'], ['for', 'from'], ['we', 'they'], ['you', 'we'],
  ['not', 'now'], ['who', 'how'],
];

/** Todas las variantes de la frase que cambian UNA palabra por su "par confundible". */
export function mutations(text) {
  const tokens = text.split(' ');
  const out = [];
  tokens.forEach((token, i) => {
    const core = cleanWord(token);
    if (!core) return;
    const lower = core.toLowerCase();
    for (const [a, b] of MINIMAL_PAIRS) {
      const replacement = lower === a.toLowerCase() ? b : lower === b.toLowerCase() ? a : null;
      if (!replacement) continue;
      const startsUpper = core[0] !== core[0].toLowerCase();
      const cased = startsUpper ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
      const copy = [...tokens];
      copy[i] = token.replace(core, cased);
      out.push(copy.join(' '));
    }
  });
  return [...new Set(out)].filter((m) => m !== text);
}

/**
 * Opciones para una ronda: la correcta + variantes parecidas; si no alcanzan, otras frases de largo similar.
 * @param {string} correct
 * @param {string[]} fallback frases alternativas (de otras partes del video)
 */
export function makeOptions(correct, fallback = [], { count = 3, random = Math.random } = {}) {
  const options = [correct];
  for (const m of shuffle(mutations(correct), random)) {
    if (options.length >= count) break;
    options.push(m);
  }
  for (const f of shuffle(fallback, random)) {
    if (options.length >= count) break;
    if (!options.includes(f)) options.push(f);
  }
  return shuffle(options, random);
}
