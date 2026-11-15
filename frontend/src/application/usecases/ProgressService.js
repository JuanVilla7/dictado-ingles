import { videoProgress } from '../../domain/services/spoken.js';

/**
 * En qué frase quedaste en cada video, y los datos de tu último video propio.
 * Se guarda el índice crudo del array (incluye frases de pantalla); lo que se muestra sale de summary().
 */
export class ProgressService {
  constructor(store) { this.store = store; }
  get(videoId) { return this.store.get('prog-' + videoId, 0); }
  set(videoId, index) { this.store.set('prog-' + videoId, index); }
  /** Progreso para mostrar, contando solo frases habladas: {done, total, finished}. */
  summary(video) { return videoProgress(video.cues, this.get(video.id)); }
  getOwn() { return { url: this.store.get('url', ''), transcript: this.store.get('transcript', ''), index: this.store.get('idx', 0) }; }
  setOwn({ url, transcript }) { if (url !== undefined) this.store.set('url', url); if (transcript !== undefined) this.store.set('transcript', transcript); }
  setOwnIndex(index) { this.store.set('idx', index); }
}
