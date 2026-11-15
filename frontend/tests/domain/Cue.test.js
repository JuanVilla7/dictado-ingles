import { describe, it, expect } from 'vitest';
import { createCue, cueFromTuple } from '../../src/domain/entities/Cue.js';

describe('Cue', () => {
  it('una tupla de 3 elementos es una frase hablada', () => {
    expect(cueFromTuple([1, 2, 'Hello there.']).spoken).toBe(true);
  });

  it('el 4º elemento "screen" marca la frase como no hablada', () => {
    const cue = cueFromTuple([0.2, 3, 'What is a Black Hole?', 'screen']);
    expect(cue.spoken).toBe(false);
    expect(cue.text).toBe('What is a Black Hole?');
  });

  it('un 4º elemento desconocido tira error', () => {
    expect(() => cueFromTuple([0, 1, 'x', 'scren'])).toThrow(/desconocido/);
  });

  it('createCue sin spoken la toma como hablada', () => {
    expect(createCue({ start: 0, end: 1, text: 'x' }).spoken).toBe(true);
  });
});
