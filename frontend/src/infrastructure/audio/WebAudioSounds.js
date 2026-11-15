/**
 * Sonidos cortos generados con Web Audio (sin archivos).
 * @implements {import('../../application/ports').SoundEffects}
 */
export class WebAudioSounds {
  #ctx = null;
  constructor(isEnabled = () => true) { this.isEnabled = isEnabled; }
  #beep(freq, dur, type = 'sine', vol = 0.05, delay = 0) {
    if (!this.isEnabled()) return;
    try {
      this.#ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = this.#ctx.createOscillator(), g = this.#ctx.createGain(), t = this.#ctx.currentTime + delay;
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.#ctx.destination); o.start(t); o.stop(t + dur);
    } catch { /* navegador sin audio */ }
  }
  success() { this.#beep(660, 0.09); this.#beep(990, 0.14, 'sine', 0.05, 0.08); }
  error() { this.#beep(180, 0.16, 'triangle', 0.06); }
}
