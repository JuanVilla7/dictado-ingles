import { describe, it, expect } from 'vitest';
import { parseTranscript, youTubeIdFrom } from '../../src/infrastructure/transcripts/transcriptParser.js';

describe('parser de transcripciones', () => {
  it('limpia el tiempo leído, capítulos, personajes y efectos (formato copiado de YouTube)', () => {
    const text = [
      '0:000 segundosMichael: All right, everybody. There has been a lot of name-calling.',
      'Capítulo 2: Graphic tales of prison life',
      '1:121 minuto y 12 segundos*kissing sounds* Jim: Where did you learn all of this?',
    ].join('\n');
    const cues = parseTranscript(text);
    expect(cues.map((c) => c.text)).toEqual(['All right, everybody.', 'There has been a lot of name-calling.', 'Where did you learn all of this?']);
  });

  it('al dividir un bloque largo conserva los límites reales (bStart/bEnd)', () => {
    const cues = parseTranscript('0:00\nFirst sentence here. Second sentence here.\n0:12\nNext.');
    expect(cues[0].bStart).toBe(0);
    expect(cues[0].bEnd).toBe(12);
    expect(cues[1].bEnd).toBe(12);
  });

  it('lee .srt', () => {
    const cues = parseTranscript('1\n00:00:01,000 --> 00:00:03,500\nHello there\n\n2\n00:00:04,000 --> 00:00:05,000\nGeneral Kenobi');
    expect(cues).toHaveLength(2);
    expect(cues[0].start).toBe(1);
    expect(cues[0].end).toBe(3.5);
  });

  it('reconoce links de YouTube', () => {
    expect(youTubeIdFrom('https://www.youtube.com/watch?v=a7RoP1LKMeM')).toBe('a7RoP1LKMeM');
    expect(youTubeIdFrom('https://youtu.be/jNQXAC9IVRw?t=3')).toBe('jNQXAC9IVRw');
    expect(youTubeIdFrom('hola')).toBeNull();
  });
});
