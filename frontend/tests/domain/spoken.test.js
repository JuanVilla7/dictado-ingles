import { describe, it, expect } from 'vitest';
import { createCue } from '../../src/domain/entities/Cue.js';
import {
  isSpoken, nextSpokenIndex, prevSpokenIndex, spokenCount, screenCueAt, startTimeFor, videoProgress,
} from '../../src/domain/services/spoken.js';

// [S, S, H, H, S, H, S, S] (S = pantalla, H = hablada). Las habladas son los índices 2, 3 y 5.
// Cada frase dura 2 s y arranca a los i*3 s, así entre frase y frase queda un hueco de 1 s.
const PATTERN = 'SSHHSHSS';
const cues = [...PATTERN].map((k, i) => createCue({ start: i * 3, end: i * 3 + 2, text: `${k}${i}`, spoken: k === 'H' }));

describe('frases habladas y de pantalla', () => {
  it('isSpoken toma como hablados los objetos sin el campo', () => {
    expect(isSpoken({ text: 'x' })).toBe(true);
    expect(isSpoken(cues[0])).toBe(false);
    expect(isSpoken(cues[2])).toBe(true);
  });

  it('nextSpokenIndex salta las de pantalla', () => {
    expect(nextSpokenIndex(cues, 0)).toBe(2);
    expect(nextSpokenIndex(cues, 4)).toBe(5);
    expect(nextSpokenIndex(cues, 6)).toBe(8); // cues.length: no hay más habladas
  });

  it('prevSpokenIndex busca hacia atrás', () => {
    expect(prevSpokenIndex(cues, 4)).toBe(3);
    expect(prevSpokenIndex(cues, 1)).toBe(-1);
  });

  it('spokenCount cuenta solo las habladas antes del índice', () => {
    expect(spokenCount(cues, 0)).toBe(0);
    expect(spokenCount(cues, 4)).toBe(2);
    expect(spokenCount(cues)).toBe(3);
  });

  it('screenCueAt devuelve la frase de pantalla que está en el video en ese momento', () => {
    expect(screenCueAt(cues, 1)).toBe(cues[0]);    // dentro de un S
    expect(screenCueAt(cues, 13)).toBe(cues[4]);   // dentro de otro S
    expect(screenCueAt(cues, 7)).toBeNull();       // dentro de un H
    expect(screenCueAt(cues, 2.5)).toBeNull();     // en un hueco
  });

  it('startTimeFor arranca en 0 si antes solo hay frases de pantalla', () => {
    expect(startTimeFor(cues, 2)).toBe(0);
    expect(startTimeFor(cues, 5)).toBeCloseTo(15 - 0.2);
  });

  it('startTimeFor no cambia los videos sin frases de pantalla', () => {
    const own = [createCue({ start: 30, end: 33, text: 'a' }), createCue({ start: 34, end: 36, text: 'b' })];
    expect(startTimeFor(own, 0)).toBeCloseTo(29.8);
    expect(startTimeFor(own, 1)).toBeCloseTo(33.8);
  });

  it('videoProgress: progreso viejo en un crédito final cuenta como terminado', () => {
    expect(videoProgress(cues, 6)).toEqual({ done: 3, total: 3, finished: true });
  });

  it('videoProgress: guardar cues.length es terminado', () => {
    expect(videoProgress(cues, cues.length)).toEqual({ done: 3, total: 3, finished: true });
  });

  it('videoProgress: sin progreso es 0', () => {
    expect(videoProgress(cues, 0)).toEqual({ done: 0, total: 3, finished: false });
    expect(videoProgress(cues, 3)).toEqual({ done: 1, total: 3, finished: false });
  });
});
