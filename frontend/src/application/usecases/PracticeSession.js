import { Observable } from './Observable.js';
import { DictationLine } from '../../domain/entities/DictationLine.js';
import { shouldAutoPause, replayWindow, manualPlayLimit, cueIndexAt } from '../../domain/services/timing.js';
import { nextSpokenIndex, prevSpokenIndex, spokenCount, screenCueAt, startTimeFor } from '../../domain/services/spoken.js';

/**
 * Caso de uso principal: una sesión de dictado sobre un video.
 * Coordina el reproductor (puerto VideoPlayer), las frases (dominio) y guarda progreso/estadísticas.
 * La interfaz llama a type(), hint(), replay()... y se redibuja cuando esta clase emite cambios.
 */
export class PracticeSession extends Observable {
  /**
   * @param {{player: import('../ports').VideoPlayer, stats: import('./StatsService').StatsService,
   *          words: import('./WordsService').WordsService, progress: import('./ProgressService').ProgressService,
   *          settings: import('./SettingsService').SettingsService, sounds: import('../ports').SoundEffects}} deps
   */
  constructor({ player, stats, words, progress, settings, sounds }) {
    super();
    Object.assign(this, { player, stats, words, progress, settings, sounds });
    this.cues = [];
    this.active = false;
    player.onPlay(() => { if (this.active && this.pausedByLine) this.#manualResume(); });
  }

  /**
   * @param {{cues: import('../../domain/entities/Cue').createCue[], startIndex?: number,
   *          videoId?: string|null, title?: {show: string, title: string}}} opts
   */
  start({ cues, startIndex = 0, videoId = null, title = null }) {
    this.cues = cues;
    this.lines = new Map();
    this.videoId = videoId;
    this.title = title;
    // Las frases de pantalla se saltean: si el progreso guardado apunta a una, seguimos en la próxima hablada.
    // Si el video estaba terminado (no quedan habladas), vuelve a empezar.
    let i = nextSpokenIndex(cues, startIndex);
    if (i >= cues.length) i = nextSpokenIndex(cues, 0);
    this.index = i;
    this.pausedByLine = false;
    this.stopAt = null;
    this.allowUntil = 0;
    this.session = { keys: 0, good: 0, words: 0, activeMs: 0, lastKey: 0, newWords: 0 };
    this.lastError = null;    // {pos, n} para animar la letra equivocada
    this.flash = 0;           // se incrementa al completar una frase (animación)
    this.finished = false;
    this.active = true;
    this.status = this.position > 1 ? `▶ Seguís desde la frase ${this.position} · Esc para play` : '▶ Dale play (Esc) y escribí lo que escuchás';
    this.#saveProgress();
    this.emit();
  }
  stop() { this.active = false; if (this.player.isReady()) this.player.pause(); }

  get cue() { return this.cues[this.index]; }
  /** Última frase hablada antes de la actual (las de pantalla no se muestran como "frase anterior"). */
  get previousCue() { const j = prevSpokenIndex(this.cues, this.index - 1); return j >= 0 ? this.cues[j] : null; }
  /** Cantidad de frases habladas del video (las de pantalla no se cuentan). */
  get spokenTotal() { return spokenCount(this.cues); }
  /** Número de la frase actual para mostrar ("Frase 3/23"), contando solo las habladas. */
  get position() { return Math.min(spokenCount(this.cues, this.index) + 1, this.spokenTotal); }
  /** Segundo en el que cargar el video para la frase actual (0 si antes solo hay carteles). */
  get startTime() { return startTimeFor(this.cues, this.index); }
  /** Frase de pantalla que se ve en `time` (la interfaz la muestra en gris), o null. */
  screenCueAt(time) { return screenCueAt(this.cues, time); }
  /** Frase actual como entidad del dominio (se crea una vez y conserva su estado si volvés atrás). */
  get line() {
    if (this.index >= this.cues.length) return null;
    if (!this.lines.has(this.index)) this.lines.set(this.index, new DictationLine(this.cues[this.index].text));
    return this.lines.get(this.index);
  }
  get accuracy() { return this.session.keys ? Math.round((this.session.good / this.session.keys) * 100) : 100; }
  get wpm() { return this.session.activeMs > 3000 ? Math.round(this.session.words / (this.session.activeMs / 60000)) : 0; }
  get completedCount() { return [...this.lines.values()].filter((l) => l.done).length; }

  /* ---------- Escritura ---------- */
  type(ch) {
    const line = this.line;
    if (!line || line.done) return;
    const now = Date.now();
    const gap = this.session.lastKey && now - this.session.lastKey < 5000 ? now - this.session.lastKey : 0;
    this.session.lastKey = now;
    this.session.activeMs += gap;
    const pos = line.pos;
    const r = line.type(ch);
    if (r.kind === 'ignored') return;
    this.session.keys++;
    if (r.kind === 'correct') this.session.good++;
    this.stats.recordKey(r.kind === 'correct', gap);
    if (r.kind === 'wrong') this.lastError = { pos, n: (this.lastError?.n || 0) + 1 };
    this.#afterAdvance(r);
  }
  hint() {
    const line = this.line;
    if (!line || line.done) return;
    this.#afterAdvance(line.hint());
  }
  skip() {
    const line = this.line;
    if (!line || line.done) return;
    line.skip();
    this.#finishLine();
  }
  #afterAdvance(r) {
    if (r.completedWord) this.session.words++;
    if (r.revealedWord) this.#saveDifficultWord(r.revealedWord);
    if (this.line.done) this.#finishLine(); else this.emit();
  }
  #saveDifficultWord(word) {
    const { created } = this.words.add(word, this.cue.text, { failed: true });
    if (created) { this.session.newWords++; this.lastSaved = { word, n: (this.lastSaved?.n || 0) + 1 }; }
  }
  /** Palabra tocada para traducir: se guarda en "Mis palabras". */
  saveTappedWord(word, context) {
    const { created } = this.words.add(word, context);
    if (created) this.session.newWords++;
  }

  #finishLine() {
    this.stats.recordPhrase();
    this.sounds.success();
    this.flash++;
    this.status = '✔ ¡Bien!';
    const wasPaused = this.pausedByLine;
    this.pausedByLine = false;
    this.emit();
    setTimeout(() => {
      if (!this.active) return;
      this.index = nextSpokenIndex(this.cues, this.index + 1);
      this.lastError = null;
      this.status = '';
      this.#saveProgress();
      if (this.index >= this.cues.length) { this.finished = true; this.emit(); return; }
      // Solo seguimos reproduciendo si la próxima frase todavía no sonó
      if (wasPaused && this.player.currentTime() < this.cue.bEnd) this.player.play();
      else if (wasPaused) this.#pauseForTyping();
      this.emit();
    }, 450);
  }

  /* ---------- Reproducción ---------- */
  /** Se llama cada ~50 ms desde la interfaz. Decide cuándo pausar. */
  tick() {
    if (!this.active || !this.player.isReady() || this.player.isPaused()) return;
    const t = this.player.currentTime();
    if (this.stopAt !== null && t >= this.stopAt) { this.player.pause(); this.stopAt = null; this.#pauseForTyping(); return; }
    if (this.finished || !this.cue) return;
    const line = this.line;
    if (this.settings.get().autoPause) {
      if (shouldAutoPause({ time: t, cue: this.cue, lineDone: line.done, allowUntil: this.allowUntil, replaying: this.stopAt !== null })) {
        this.player.pause();
        this.#pauseForTyping();
      }
    } else {
      const j = cueIndexAt(this.cues, t, this.index);
      if (j > this.index) { this.index = j; this.#saveProgress(); this.emit(); }
    }
  }
  #pauseForTyping() { this.pausedByLine = true; this.status = '⏸ Escribí lo que escuchaste · Tab para repetir'; this.emit(); }
  #manualResume() {
    this.allowUntil = manualPlayLimit(this.cues, this.player.currentTime());
    this.pausedByLine = false;
    this.stopAt = null;
    this.status = '';
    this.emit();
  }
  togglePlay() {
    if (this.player.isPaused()) { this.#manualResume(); this.player.play(); } else this.player.pause();
  }
  /** Tab: repite la frase actual (con al menos N segundos de audio). */
  replay() {
    if (!this.cue) return;
    const { start, end } = replayWindow(this.cue, this.settings.get().win);
    this.pausedByLine = false;
    this.stopAt = this.line?.done ? null : end;
    this.status = '';
    this.player.seek(start);
    this.player.play();
    this.emit();
  }
  goTo(i) {
    if (!this.cues.length) return;
    // La dirección decide hacia dónde saltear las frases de pantalla: ‹ busca hacia atrás, › hacia adelante.
    let j;
    if (i < this.index) {
      j = prevSpokenIndex(this.cues, i);
      if (j < 0) j = nextSpokenIndex(this.cues, 0);
    } else {
      j = nextSpokenIndex(this.cues, i);
      if (j >= this.cues.length) j = prevSpokenIndex(this.cues, this.cues.length - 1);
    }
    this.index = j;
    this.finished = false;
    this.pausedByLine = false;
    this.stopAt = null;
    this.allowUntil = 0;
    this.status = '';
    this.#saveProgress();
    this.player.seek(this.startTime);
    this.player.play();
    this.emit();
  }
  #saveProgress() {
    if (this.videoId) this.progress.set(this.videoId, Math.min(this.index, this.cues.length));
    else this.progress.setOwnIndex(this.index);
  }
}
