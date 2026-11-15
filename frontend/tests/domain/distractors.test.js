import { describe, it, expect } from 'vitest';
import { mutations, makeOptions } from '../../src/domain/services/distractors.js';

describe('distractores (¿Qué escuchaste?)', () => {
  it('cambia una sola palabra por su par confundible', () => {
    const m = mutations('Is he still there?');
    expect(m).toContain('Is she still there?');
    expect(m).toContain('Is he still here?');
    expect(m).toContain('Was he still there?');
  });

  it('respeta la mayúscula inicial', () => {
    expect(mutations('He can swim.')).toContain('She can swim.');
  });

  it('siempre incluye la respuesta correcta y no repite opciones', () => {
    const opts = makeOptions('Is he still there?', []);
    expect(opts).toContain('Is he still there?');
    expect(new Set(opts).size).toBe(opts.length);
    expect(opts).toHaveLength(3);
  });

  it('si no hay pares confundibles, completa con otras frases', () => {
    const opts = makeOptions('Clever fellow.', ['Good night.', 'Words can hurt.']);
    expect(opts).toHaveLength(3);
    expect(opts).toContain('Clever fellow.');
  });
});
