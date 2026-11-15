import { describe, it, expect } from 'vitest';
import { DictationLine, MAX_MISSES } from '../../src/domain/entities/DictationLine.js';

const typeAll = (line, s) => [...s].map((c) => line.type(c));

describe('DictationLine', () => {
  it('ignora espacios y signos: solo cuentan letras y números', () => {
    const line = new DictationLine("It's hers.");
    expect(line.length).toBe(7); // I t s h e r s
    expect(line.type(' ').kind).toBe('ignored');
    expect(line.type("'").kind).toBe('ignored');
  });

  it('acepta mayúsculas y acentos indistintamente', () => {
    const line = new DictationLine('Café');
    typeAll(line, 'CAFE');
    expect(line.done).toBe(true);
  });

  it('marca error sin avanzar', () => {
    const line = new DictationLine('hi');
    expect(line.type('x').kind).toBe('wrong');
    expect(line.pos).toBe(0);
  });

  it(`revela la letra después de ${MAX_MISSES} errores y devuelve la palabra que costó`, () => {
    const line = new DictationLine('big cat');
    typeAll(line, 'big');
    line.type('x'); line.type('x');
    const r = line.type('x');
    expect(r.kind).toBe('revealed');
    expect(r.revealedWord).toBe('cat');
    expect(line.letters[3].mark).toBe('rev');
  });

  it('avisa cuando se completa una palabra', () => {
    const line = new DictationLine('to be');
    expect(line.type('t').completedWord).toBe(false);
    expect(line.type('o').completedWord).toBe(true);
  });

  it('una palabra se puede tocar recién cuando está completa', () => {
    const line = new DictationLine('to be');
    typeAll(line, 't');
    expect(line.isWordComplete(0)).toBe(false);
    typeAll(line, 'o');
    expect(line.isWordComplete(0)).toBe(true);
    expect(line.isWordComplete(1)).toBe(false);
  });

  it('skip revela todo lo que falta', () => {
    const line = new DictationLine('hello there');
    typeAll(line, 'he');
    line.skip();
    expect(line.done).toBe(true);
    expect(line.letters.slice(2).every((l) => l.mark === 'rev')).toBe(true);
  });
});
