import { describe, it, expect } from 'vitest';
import { eligibleRounds, scrambledOrder, isCorrectOrder, resultMessage } from '../../src/domain/services/games.js';
import { computeStreak, dayKey } from '../../src/domain/services/streak.js';

describe('juegos', () => {
  it('descarta frases muy cortas y las cortinas de NASA', () => {
    const video = { cues: [{ text: 'Hi.' }, { text: 'We Asked a NASA Scientist.' }, { text: 'Space is really really big.' }] };
    expect(eligibleRounds([video], 'listen').map((r) => r.cue.text)).toEqual(['Space is really really big.']);
  });

  it('el orden mezclado nunca es el correcto', () => {
    for (let i = 0; i < 50; i++) {
      const o = scrambledOrder(3);
      expect(o.every((x, k) => x === k)).toBe(false);
    }
  });

  it('compara el orden sin importar mayúsculas ni signos', () => {
    expect(isCorrectOrder(['Is', 'your', 'husband', 'with', 'you?'], ['is', 'your', 'husband', 'with', 'you'])).toBe(true);
    expect(isCorrectOrder(['your', 'Is'], ['Is', 'your'])).toBe(false);
  });

  it('mensaje según el puntaje', () => {
    expect(resultMessage(10, 10)).toMatch(/Perfecto/);
    expect(resultMessage(2, 10)).toMatch(/seguir/);
  });
});

describe('racha', () => {
  const day = (offset) => { const d = new Date(2026, 10, 14); d.setDate(d.getDate() - offset); return dayKey(d); };
  const today = new Date(2026, 10, 14);
  it('cuenta días seguidos', () => {
    expect(computeStreak({ [day(0)]: { phr: 3 }, [day(1)]: { phr: 1 }, [day(3)]: { phr: 5 } }, today)).toBe(2);
  });
  it('si hoy no practicaste, sigue contando desde ayer', () => {
    expect(computeStreak({ [day(1)]: { phr: 1 }, [day(2)]: { phr: 1 } }, today)).toBe(2);
  });
});
