/**
 * Palabra guardada en "Mis palabras" + reglas de repetición espaciada (sistema de cajas de Leitner):
 * cada vez que la sabés, sube de caja y vuelve más tarde; si no te acordás, vuelve a la caja 0.
 */
export const DAY_MS = 86_400_000;
/** Días hasta el próximo repaso según la caja. */
export const BOX_DAYS = [0, 1, 3, 7, 16, 35];
export const Grade = Object.freeze({ AGAIN: 0, GOOD: 2, EASY: 3 });

export function createWord({ text, context = '', now }) {
  return { w: text, ctx: context, tr: '', box: 0, next: now, added: now, fails: 0 };
}

/** Se equivocó o pidió pista en esta palabra: vuelve al principio y queda para repasar ya. */
export const markFailed = (word, now) => ({ ...word, fails: word.fails + 1, box: 0, next: now });

export function gradeWord(word, grade, now) {
  if (grade === Grade.AGAIN) return { ...word, box: 0, next: now };
  const box = Math.min(BOX_DAYS.length - 1, word.box + (grade === Grade.EASY ? 2 : 1));
  return { ...word, box, next: now + BOX_DAYS[box] * DAY_MS };
}

export const isDue = (word, now) => word.next <= now;

/** No guardamos números ni letras sueltas (salvo "I"). */
export const isSavableKey = (key) => !!key && (key.length >= 2 || key === 'i') && !/^\d+$/.test(key);
