import { Observable } from './Observable.js';
import { eligibleRounds, scrambledOrder, isCorrectOrder, ROUNDS_PER_GAME } from '../../domain/services/games.js';
import { makeOptions } from '../../domain/services/distractors.js';
import { shuffle, tokenize } from '../../domain/services/text.js';

/**
 * Caso de uso de los juegos de escucha:
 *  - 'listen' (¿Qué escuchaste?): elegir entre 3 opciones parecidas.
 *  - 'order'  (Ordená la frase): tocar las palabras en orden.
 */
export class GameSession extends Observable {
  constructor({ player, stats, sounds, store, random = Math.random }) {
    super();
    Object.assign(this, { player, stats, sounds, store, random });
    this.best = store.get('best', {});
    this.active = false;
  }

  /** @returns {boolean} false si no hay frases suficientes */
  start(type, videos) {
    const pool = eligibleRounds(videos, type);
    if (!pool.length) return false;
    Object.assign(this, { type, videos, pool, rounds: shuffle(pool, this.random).slice(0, ROUNDS_PER_GAME), i: 0, score: 0, finished: false, active: true, stopAt: null });
    this.#setupRound();
    return true;
  }
  stop() { this.active = false; this.stopAt = null; if (this.player.isReady()) this.player.pause(); }

  get round() { return this.rounds[this.i]; }
  get total() { return this.rounds.length; }

  #setupRound() {
    const { cue } = this.round;
    this.answered = false;
    this.correct = null;
    if (this.type === 'listen') {
      const similar = this.pool.filter((p) => p.cue.text !== cue.text && Math.abs(p.words - this.round.words) <= 3).map((p) => p.cue.text);
      this.options = makeOptions(cue.text, similar, { random: this.random });
    } else {
      this.tokens = tokenize(cue.text);
      this.order = scrambledOrder(this.tokens.length, this.random);
      this.picked = [];   // índices de tokens elegidos
    }
    this.emit();
    this.play();
  }

  /** Reproduce la frase de la ronda (más lento si se pide). */
  async play(slow = false) {
    if (!this.active) return;
    const { video, cue } = this.round;
    if (this.player.currentVideoId() !== video.id) await this.player.loadYouTube(video.id, Math.max(0, cue.start - 0.2), { autoplay: true });
    if (!this.active || this.round.cue !== cue) return;
    this.player.setRate(slow ? 0.75 : 1);
    this.player.seek(Math.max(0, cue.start - 0.25));
    this.player.play();
    this.stopAt = cue.end + 0.35;
    // Si YouTube recién cargó el video y no arrancó, reintentamos un par de veces
    for (let k = 0; k < 6; k++) {
      await new Promise((r) => setTimeout(r, 400));
      if (!this.active || this.round?.cue !== cue || this.stopAt === null || !this.player.isPaused()) return;
      this.player.seek(Math.max(0, cue.start - 0.25));
      this.player.play();
    }
  }
  tick() {
    if (!this.active || this.stopAt === null || !this.player.isReady() || this.player.isPaused()) return;
    if (this.player.currentTime() >= this.stopAt) { this.player.pause(); this.stopAt = null; }
  }

  /* ¿Qué escuchaste? */
  choose(option) {
    if (this.type !== 'listen' || this.answered) return;
    this.#resolve(option === this.round.cue.text);
    this.chosen = option;
  }

  /* Ordená la frase */
  pick(tokenIndex) {
    if (this.type !== 'order' || this.answered || this.picked.includes(tokenIndex)) return;
    this.picked = [...this.picked, tokenIndex];
    if (this.picked.length === this.tokens.length) this.#resolve(isCorrectOrder(this.picked.map((i) => this.tokens[i]), this.tokens));
    else this.emit();
  }
  unpick(tokenIndex) {
    if (this.answered) return;
    this.picked = this.picked.filter((i) => i !== tokenIndex);
    this.emit();
  }
  undo() { if (!this.answered && this.picked.length) { this.picked = this.picked.slice(0, -1); this.emit(); } }

  #resolve(ok) {
    this.answered = true;
    this.correct = ok;
    if (ok) { this.score++; this.sounds.success(); this.stats.recordPhrase(); } else this.sounds.error();
    this.emit();
  }

  next() {
    if (!this.answered) return;
    if (this.i + 1 < this.rounds.length) { this.i++; this.#setupRound(); return; }
    this.finished = true;
    this.stopAt = null;
    if (this.player.isReady()) this.player.pause();
    if (this.best[this.type] == null || this.score > this.best[this.type]) { this.best[this.type] = this.score; this.store.set('best', this.best); }
    this.emit();
  }
}
