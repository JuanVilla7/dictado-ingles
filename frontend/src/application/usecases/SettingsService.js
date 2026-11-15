import { Observable } from './Observable.js';

export const DEFAULT_SETTINGS = Object.freeze({ mode: 'gaps', win: 5, rate: 1, autoPause: true, sound: true, theme: 'light' });

/** Preferencias del usuario (modo de ver la frase, velocidad, tema, etc.). */
export class SettingsService extends Observable {
  /** @param {import('../ports').KeyValueStore} store */
  constructor(store) {
    super();
    this.store = store;
    this.values = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) };
  }
  get() { return this.values; }
  update(patch) {
    this.values = { ...this.values, ...patch };
    this.store.set('settings', this.values);
    this.emit();
  }
}
