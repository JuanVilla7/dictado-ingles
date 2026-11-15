import { Observable } from './Observable.js';
import { createWord, gradeWord, markFailed, isDue, isSavableKey } from '../../domain/entities/Word.js';
import { wordKey } from '../../domain/services/text.js';

/** Caso de uso "Mis palabras": guardar, quitar, listar y repasar. */
export class WordsService extends Observable {
  /**
   * @param {import('../ports').KeyValueStore} store
   * @param {import('../ports').Translator} translator
   */
  constructor(store, translator, now = () => Date.now()) {
    super();
    this.store = store;
    this.translator = translator;
    this.now = now;
    this.words = store.get('words', {});
  }
  #save() { this.store.set('words', this.words); this.emit(); }

  has(text) { return !!this.words[wordKey(text)]; }
  list() { return Object.entries(this.words).sort((a, b) => b[1].added - a[1].added).map(([key, w]) => ({ key, ...w })); }
  due() { const now = this.now(); return Object.entries(this.words).filter(([, w]) => isDue(w, now)).sort((a, b) => a[1].next - b[1].next).map(([k]) => k); }
  get(key) { return this.words[key]; }

  /** @returns {{created: boolean}} */
  add(text, context, { failed = false } = {}) {
    const key = wordKey(text);
    if (!isSavableKey(key)) return { created: false };
    const created = !this.words[key];
    if (created) this.words[key] = createWord({ text, context, now: this.now() });
    if (failed) this.words[key] = markFailed(this.words[key], this.now());
    this.#save();
    if (!this.words[key].tr) this.#translate(key);
    return { created };
  }
  remove(text) { delete this.words[wordKey(text)]; this.#save(); }
  grade(key, grade) { if (this.words[key]) { this.words[key] = gradeWord(this.words[key], grade, this.now()); this.#save(); } }

  async #translate(key) {
    const t = await this.translator.translate(this.words[key].w).catch(() => null);
    if (t?.main && this.words[key]) { this.words[key].tr = t.main; this.#save(); }
  }
  async ensureTranslation(key) { if (this.words[key] && !this.words[key].tr) await this.#translate(key); return this.words[key]?.tr || ''; }
}
