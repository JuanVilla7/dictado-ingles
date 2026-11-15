import { Observable } from './Observable.js';
import { Grade } from '../../domain/entities/Word.js';
import { shuffle } from '../../domain/services/text.js';

/** Repaso con tarjetas: muestra la palabra, revela el significado y la califica. */
export class ReviewSession extends Observable {
  constructor({ words, stats, sounds }) {
    super();
    Object.assign(this, { words, stats, sounds });
    this.active = false;
  }
  /** Repasa las pendientes; si no hay, 15 al azar. */
  start() {
    let queue = this.words.due();
    if (!queue.length) queue = shuffle(this.words.list().map((w) => w.key)).slice(0, 15);
    if (!queue.length) return false;
    Object.assign(this, { queue, i: 0, revealed: false, active: true, finished: false });
    this.emit();
    return true;
  }
  stop() { this.active = false; this.emit(); }
  get current() { return this.queue[this.i] ? { key: this.queue[this.i], ...this.words.get(this.queue[this.i]) } : null; }
  reveal() { this.revealed = true; this.emit(); }
  grade(grade) {
    if (!this.revealed || !this.current) return;
    const key = this.queue[this.i];
    this.words.grade(key, grade);
    if (grade === Grade.AGAIN) { this.queue.push(key); this.sounds.error(); }
    else { this.sounds.success(); this.stats.recordPhrase(); }
    this.i++;
    this.revealed = false;
    if (this.i >= this.queue.length) { this.finished = true; this.active = false; }
    this.emit();
  }
}
