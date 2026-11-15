import { describe, it, expect } from 'vitest';
import { shouldAutoPause, replayWindow, manualPlayLimit, cueIndexAt, PAUSE_MARGIN } from '../../src/domain/services/timing.js';
import { createCue } from '../../src/domain/entities/Cue.js';

const cue = createCue({ start: 5, end: 7, text: 'x', bStart: 0, bEnd: 12 });

describe('timing del dictado', () => {
  it('no pausa antes del final del bloque real (aunque la frase estimada ya terminó)', () => {
    expect(shouldAutoPause({ time: 8, cue, lineDone: false })).toBe(false);
    expect(shouldAutoPause({ time: 12 + PAUSE_MARGIN, cue, lineDone: false })).toBe(true);
  });

  it('no pausa si la frase ya está completa o si se está repitiendo', () => {
    expect(shouldAutoPause({ time: 99, cue, lineDone: true })).toBe(false);
    expect(shouldAutoPause({ time: 99, cue, lineDone: false, replaying: true })).toBe(false);
  });

  it('si el usuario dio play a mano, lo deja seguir hasta allowUntil', () => {
    expect(shouldAutoPause({ time: 14, cue, lineDone: false, allowUntil: 20 })).toBe(false);
  });

  it('Tab repite al menos los segundos pedidos', () => {
    const short = createCue({ start: 10, end: 11, text: 'x' });
    const w = replayWindow(short, 5);
    expect(w.end - w.start).toBeGreaterThanOrEqual(5);
    expect(w.start).toBeGreaterThanOrEqual(0);
  });

  it('play manual: límite = final del próximo bloque', () => {
    const cues = [createCue({ start: 0, end: 4, text: 'a' }), createCue({ start: 4, end: 9, text: 'b' })];
    expect(manualPlayLimit(cues, 4.2)).toBe(9);
    expect(manualPlayLimit(cues, 20)).toBe(Infinity);
  });

  it('sin pausas, sigue a la frase que está sonando', () => {
    const cues = [0, 3, 6, 9].map((s) => createCue({ start: s, end: s + 3, text: 'x' }));
    expect(cueIndexAt(cues, 7, 0)).toBe(2);
    expect(cueIndexAt(cues, 1, 2)).toBe(2); // nunca retrocede
  });

  it('manualPlayLimit ignora las frases de pantalla', () => {
    const cues = [createCue({ start: 5, end: 9, text: 'hablada' }), createCue({ start: 10, end: 12, text: 'NASA.', spoken: false })];
    expect(manualPlayLimit(cues, 9.6)).toBe(Infinity); // no 12: un play manual no frena al final de un crédito
  });

  it('cueIndexAt sin pausa automática nunca cae en una frase de pantalla', () => {
    const spoken = [true, true, false, false, true];
    const cues = spoken.map((sp, i) => createCue({ start: i * 3, end: i * 3 + 3, text: 'x', spoken: sp }));
    expect(cueIndexAt(cues, 7, 0)).toBe(1);   // dentro de un cartel → la última hablada anterior
    expect(cueIndexAt(cues, 10, 1)).toBe(1);  // no hay una hablada nueva → se queda
    expect(cueIndexAt(cues, 12.5, 1)).toBe(4);
  });
});
