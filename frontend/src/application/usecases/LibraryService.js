import { cueFromTuple } from '../../domain/entities/Cue.js';

/** Videos de la biblioteca, con sus frases convertidas a entidades Cue. */
export class LibraryService {
  /** @param {import('../ports').LibraryRepository} repo */
  constructor(repo) { this.repo = repo; this.videos = []; }
  async load() {
    const raw = await this.repo.getAll();
    this.videos = raw.map((v) => ({ ...v, cues: v.cues.map(cueFromTuple) }));
    return this.videos;
  }
  find(id) { return this.videos.find((v) => v.id === id); }
}
