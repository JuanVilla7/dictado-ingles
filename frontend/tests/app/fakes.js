/** Implementaciones de prueba de los puertos: sin YouTube, sin internet, sin localStorage. */
export class FakePlayer {
  t = 0; paused = true; id = null; listeners = new Set(); ready = false; rate = 1;
  mount() {}
  onPlay(cb) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  async loadYouTube(id, start = 0, { autoplay = false } = {}) { this.id = id; this.t = start; this.ready = true; this.source = 'yt'; if (autoplay) this.play(); }
  loadFile() { this.ready = true; this.source = 'file'; }
  isReady() { return this.ready; }
  currentVideoId() { return this.id; }
  play() { const was = this.paused; this.paused = false; if (was) this.listeners.forEach((c) => c()); }
  pause() { this.paused = true; }
  isPaused() { return this.paused; }
  currentTime() { return this.t; }
  duration() { return 120; }
  seek(t) { this.t = t; }
  setRate(r) { this.rate = r; }
  advance(sec) { if (!this.paused) this.t += sec; }
}
export class MemoryStore { data = {}; get(k, d) { return k in this.data ? structuredClone(this.data[k]) : d; } set(k, v) { this.data[k] = structuredClone(v); } }
export const fakeTranslator = { translate: async (t) => ({ main: `[es] ${t}`, alternatives: [{ pos: 'sustantivo', terms: ['uno', 'dos'] }] }) };
export const fakePhonetics = { lookup: async () => ({ ipa: '/test/', audio: '' }) };
export const silentSounds = { success() {}, error() {} };
export const fakeSpeech = { say() {} };
