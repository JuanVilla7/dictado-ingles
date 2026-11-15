/** En qué frase quedaste en cada video, y los datos de tu último video propio. */
export class ProgressService {
  constructor(store) { this.store = store; }
  get(videoId) { return this.store.get('prog-' + videoId, 0); }
  set(videoId, index) { this.store.set('prog-' + videoId, index); }
  getOwn() { return { url: this.store.get('url', ''), transcript: this.store.get('transcript', ''), index: this.store.get('idx', 0) }; }
  setOwn({ url, transcript }) { if (url !== undefined) this.store.set('url', url); if (transcript !== undefined) this.store.set('transcript', transcript); }
  setOwnIndex(index) { this.store.set('idx', index); }
}
