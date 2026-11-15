import { loadYouTubeApi } from './youtubeApi.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Reproductor único de la app: YouTube (iframe) o un archivo local (<video>).
 * La capa de aplicación solo ve los métodos del puerto VideoPlayer.
 * @implements {import('../../application/ports').VideoPlayer}
 */
export class MediaPlayer {
  #yt = null; #ytReady = false; #source = null; #listeners = new Set();
  #ytHost = null; #video = null; #onError = () => {};

  /** La interfaz le pasa los elementos donde dibujar (ver presentation/components/VideoStage.jsx). */
  mount({ youtubeHost, videoElement, onError }) {
    this.#ytHost = youtubeHost;
    this.#video = videoElement;
    if (onError) this.#onError = onError;
    videoElement.addEventListener('play', () => this.#emitPlay());
  }
  onPlay(cb) { this.#listeners.add(cb); return () => this.#listeners.delete(cb); }
  #emitPlay() { this.#listeners.forEach((cb) => cb()); }

  get source() { return this.#source; }

  async loadYouTube(id, start = 0, { autoplay = false } = {}) {
    const YT = await loadYouTubeApi();
    this.#source = 'yt';
    this.#video.pause();
    if (this.#yt && this.#ytReady) {
      if ((this.#yt.getVideoData() || {}).video_id !== id) {
        autoplay ? this.#yt.loadVideoById(id, start) : this.#yt.cueVideoById(id, start);
      } else this.#yt.seekTo(start, true);
    } else {
      this.#ytReady = false;
      const target = document.createElement('div');
      this.#ytHost.replaceChildren(target);
      this.#yt = new YT.Player(target, {
        videoId: id,
        playerVars: { rel: 0, playsinline: 1, disablekb: 1, cc_load_policy: 0, iv_load_policy: 3, start: Math.floor(start), autoplay: autoplay ? 1 : 0 },
        events: {
          onReady: () => { this.#ytReady = true; },
          onStateChange: (e) => { if (e.data === 1) this.#emitPlay(); },
          onError: (e) => this.#onError(e.data === 101 || e.data === 150
            ? 'Este video no se puede reproducir fuera de YouTube.'
            : `YouTube no pudo reproducir el video (error ${e.data}).`),
        },
      });
    }
    // Esperamos a que el reproductor esté listo con el video pedido (getVideoData puede tardar)
    for (let i = 0; i < 60 && this.currentVideoId() !== id; i++) await sleep(150);
  }

  loadFile(file, start = 0) {
    if (this.#yt && this.#ytReady) this.#yt.pauseVideo();
    this.#source = 'file';
    this.#video.src = URL.createObjectURL(file);
    this.#video.currentTime = start;
  }

  isReady() { return this.#source === 'file' ? !!this.#video.src : this.#source === 'yt' && this.#ytReady; }
  currentVideoId() { return this.#source === 'yt' && this.#ytReady ? (this.#yt.getVideoData() || {}).video_id || null : null; }
  play() { if (!this.isReady()) return; this.#source === 'yt' ? this.#yt.playVideo() : this.#video.play().catch(() => {}); }
  pause() { if (!this.isReady()) return; this.#source === 'yt' ? this.#yt.pauseVideo() : this.#video.pause(); }
  isPaused() { if (!this.isReady()) return true; return this.#source === 'yt' ? ![1, 3].includes(this.#yt.getPlayerState()) : this.#video.paused; }
  currentTime() { if (!this.isReady()) return 0; return this.#source === 'yt' ? this.#yt.getCurrentTime() || 0 : this.#video.currentTime; }
  duration() { if (!this.isReady()) return 0; return this.#source === 'yt' ? this.#yt.getDuration() || 0 : this.#video.duration || 0; }
  seek(t) { if (!this.isReady()) return; this.#source === 'yt' ? this.#yt.seekTo(t, true) : (this.#video.currentTime = t); }
  setRate(r) { if (!this.isReady()) return; this.#source === 'yt' ? this.#yt.setPlaybackRate(r) : (this.#video.playbackRate = r); }
}
