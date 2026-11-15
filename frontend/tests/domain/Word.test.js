import { describe, it, expect } from 'vitest';
import { createWord, gradeWord, markFailed, isDue, isSavableKey, Grade, DAY_MS, BOX_DAYS } from '../../src/domain/entities/Word.js';

const now = 1_000_000;

describe('Word (repetición espaciada)', () => {
  it('una palabra nueva queda para repasar ya', () => {
    const w = createWord({ text: 'hers', context: "It's hers.", now });
    expect(isDue(w, now)).toBe(true);
    expect(w.box).toBe(0);
  });

  it('"Bien" sube una caja y la programa para más adelante', () => {
    const w = gradeWord(createWord({ text: 'x', now }), Grade.GOOD, now);
    expect(w.box).toBe(1);
    expect(w.next).toBe(now + BOX_DAYS[1] * DAY_MS);
    expect(isDue(w, now)).toBe(false);
  });

  it('"Fácil" sube dos cajas', () => {
    expect(gradeWord(createWord({ text: 'x', now }), Grade.EASY, now).box).toBe(2);
  });

  it('nunca pasa de la última caja', () => {
    let w = createWord({ text: 'x', now });
    for (let i = 0; i < 10; i++) w = gradeWord(w, Grade.EASY, now);
    expect(w.box).toBe(BOX_DAYS.length - 1);
  });

  it('"No me acordaba" y los errores la vuelven a la caja 0', () => {
    const w = { ...createWord({ text: 'x', now }), box: 4, next: now + 99 };
    expect(gradeWord(w, Grade.AGAIN, now).box).toBe(0);
    const f = markFailed(w, now);
    expect(f.box).toBe(0);
    expect(f.fails).toBe(1);
    expect(isDue(f, now)).toBe(true);
  });

  it('no guarda números ni letras sueltas, salvo "I"', () => {
    expect(isSavableKey('i')).toBe(true);
    expect(isSavableKey('a')).toBe(false);
    expect(isSavableKey('1854')).toBe(false);
    expect(isSavableKey('hello')).toBe(true);
  });
});
