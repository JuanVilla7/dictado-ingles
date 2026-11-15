import { createCue } from '../../domain/entities/Cue.js';

/**
 * Convierte transcripciones (.srt/.vtt o texto copiado de YouTube) en Cues.
 * Limpia nombres de personajes, efectos ("*music*"), capítulos y el tiempo "leído" que pega YouTube.
 */
function toSeconds(t) {
  const p = t.trim().replace(',', '.').split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

export const cleanCaption = (t) => t
  .replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').replace(/\[[^\]]*\]/g, '').replace(/\*[^*]*\*/g, '').replace(/\([^)]*\)/g, '').replace(/♪/g, '')
  .replace(/(^|[\s.!?…,"])(?:[A-Z][\w'’]*(?:\s[A-Z][\w'’]*)?|>>)\s?:\s/g, '$1')   // "Michael: ", "Jim Halpert: "
  .replace(/\s+/g, ' ').trim();

export function parseSubtitles(text) {
  const out = [];
  for (const block of text.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, z] = lines[i].split('-->');
    const txt = cleanCaption(lines.slice(i + 1).join(' '));
    if (!txt) continue;
    const cue = { start: toSeconds(a), end: toSeconds(z.trim().split(' ')[0]), text: txt };
    const prev = out[out.length - 1];
    if (prev && (prev.text === cue.text || prev.text.endsWith(cue.text))) { prev.end = cue.end; continue; }
    if (prev && cue.text.startsWith(prev.text)) { prev.text = cue.text; prev.end = cue.end; continue; }
    out.push(cue);
  }
  return out.map((c) => createCue(c));
}

export function parseYouTubeTranscript(text) {
  const out = [];
  const timeRe = /^(\d{1,2}:\d{2}(?::\d{2})?)(.*)$/;
  const spoken = /^\s*\d+\s*(?:horas?|hours?|minutos?|minutes?|segundos?|seconds?)(?:,?\s*(?:y|and)?\s*\d+\s*(?:minutos?|minutes?|segundos?|seconds?))*/i;
  const chapter = /^(cap[íi]tulo|chapter)\s*\d+/i;
  for (let l of text.replace(/\r/g, '').split('\n')) {
    l = l.trim();
    if (!l || chapter.test(l) || (/^\d+\s*(segundos?|seconds?|minutos?|minutes?)/i.test(l) && !timeRe.test(l))) continue;
    const m = l.match(timeRe);
    if (m) out.push({ start: toSeconds(m[1]), text: m[2].replace(spoken, '') });
    else if (out.length) out[out.length - 1].text += ' ' + l;
  }
  const res = out.map((c) => ({ ...c, text: cleanCaption(c.text) })).filter((c) => /[\p{L}\p{N}]/u.test(c.text));
  res.forEach((c, i) => { c.end = res[i + 1] ? Math.min(res[i + 1].start, c.start + 15) : c.start + 6; });
  return splitLongBlocks(res);
}

/** Bloques largos (>6 s) se dividen en oraciones, repartiendo el tiempo según el largo (bStart/bEnd quedan reales). */
export function splitLongBlocks(list) {
  const out = [];
  for (const c of list) {
    const parts = c.text.match(/[^.!?…]+(?:[.!?…]+["')\]]*|$)/g)?.map((x) => x.trim()).filter((x) => /[\p{L}\p{N}]/u.test(x)) || [c.text];
    if (c.end - c.start <= 6 || parts.length < 2) { out.push(createCue(c)); continue; }
    const groups = [];
    for (const p of parts) {
      const g = groups[groups.length - 1];
      if (g && g.split(/\s+/).length < 3) groups[groups.length - 1] = g + ' ' + p; else groups.push(p);
    }
    if (groups.length > 1 && groups[groups.length - 1].split(/\s+/).length < 3) { const last = groups.pop(); groups[groups.length - 1] += ' ' + last; }
    const total = groups.reduce((n, g) => n + g.length, 0);
    let t = c.start;
    for (const g of groups) {
      const d = ((c.end - c.start) * g.length) / total;
      out.push(createCue({ start: t, end: t + d, text: g, bStart: c.start, bEnd: c.end }));
      t += d;
    }
  }
  return out;
}

export const parseTranscript = (text) => (text.includes('-->') ? parseSubtitles(text) : parseYouTubeTranscript(text));

export function youTubeIdFrom(url) {
  const u = (url || '').trim();
  if (/^[\w-]{11}$/.test(u)) return u;
  const m = u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
