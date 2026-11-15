import { Observable } from './Observable.js';
import { computeStreak, dayKey } from '../../domain/services/streak.js';

/** Estadísticas por día: frases, teclas, aciertos y tiempo activo. Alimenta la racha del inicio. */
export class StatsService extends Observable {
  constructor(store, clock = () => new Date()) {
    super();
    this.store = store;
    this.clock = clock;
    this.days = store.get('days', {});
  }
  #today() { return (this.days[dayKey(this.clock())] ||= { phr: 0, keys: 0, good: 0, ms: 0 }); }
  #save() { this.store.set('days', this.days); this.emit(); }

  today() { return this.days[dayKey(this.clock())] || { phr: 0, keys: 0, good: 0, ms: 0 }; }
  streak() { return computeStreak(this.days, this.clock()); }
  recordKey(correct, activeMs = 0) { const d = this.#today(); d.keys++; if (correct) d.good++; d.ms += activeMs; this.store.set('days', this.days); }
  recordPhrase() { this.#today().phr++; this.#save(); }
}
