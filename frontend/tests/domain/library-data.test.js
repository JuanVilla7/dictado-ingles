import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { cueFromTuple } from '../../src/domain/entities/Cue.js';
import { spokenCount } from '../../src/domain/services/spoken.js';
import { eligibleRounds } from '../../src/domain/services/games.js';

// Los tests corren en Node, así que podemos leer el JSON real de la biblioteca con fs.
// Pasarlo por cueFromTuple además comprueba que no haya un 4º elemento mal escrito.
const raw = JSON.parse(readFileSync(new URL('../../public/videos.json', import.meta.url), 'utf8'));
const videos = raw.map((v) => ({ ...v, cues: v.cues.map(cueFromTuple) }));

// Frases habladas por video (confirmadas por el dueño mirando los videos).
const NASA = { EJXTZ5jpSmk: 23, '2aVWZOFrjdc': 31, ryHNj_SLwlE: 36, 's3bffub-9UM': 28, 'r0bbq-soSfI': 26 };

describe('datos de la biblioteca (videos.json)', () => {
  it('cada video de la biblioteca tiene la cantidad de frases habladas esperada', () => {
    for (const v of videos) {
      const expected = v.show === 'Charade' ? v.cues.length : NASA[v.id];
      expect(expected, `video sin cuenta esperada: ${v.id}`).toBeDefined();
      expect(spokenCount(v.cues), `${v.id} · ${v.title}`).toBe(expected);
    }
    expect(videos.filter((v) => v.show === 'Charade')).toHaveLength(5);
  });

  it('ninguna frase de pantalla entra en los juegos', () => {
    for (const type of ['listen', 'order']) {
      const pool = eligibleRounds(videos, type);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.filter((r) => r.cue.spoken === false)).toEqual([]);
    }
  });
});
