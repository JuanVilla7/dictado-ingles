/**
 * PUERTOS: lo que la capa de aplicación necesita del mundo exterior, sin saber cómo está hecho.
 * Las implementaciones concretas viven en /infrastructure y se conectan en main.jsx.
 * (En JavaScript no hay interfaces: las documentamos con JSDoc.)
 */

/**
 * @typedef {Object} VideoPlayer
 * @property {(videoId: string, start?: number, opts?: {autoplay?: boolean}) => Promise<void>} loadYouTube
 * @property {(file: File, start?: number) => void} loadFile
 * @property {() => void} play
 * @property {() => void} pause
 * @property {() => boolean} isPaused
 * @property {() => boolean} isReady
 * @property {() => number} currentTime
 * @property {() => number} duration
 * @property {(seconds: number) => void} seek
 * @property {(rate: number) => void} setRate
 * @property {() => string|null} currentVideoId
 * @property {(cb: () => void) => () => void} onPlay  se dispara cuando el video empieza a sonar
 */

/**
 * @typedef {Object} Translator
 * @property {(text: string) => Promise<{main: string, alternatives: {pos: string, terms: string[]}[]}>} translate
 */

/**
 * @typedef {Object} Phonetics
 * @property {(word: string) => Promise<{ipa: string, audio: string}|null>} lookup
 */

/**
 * @typedef {Object} KeyValueStore
 * @property {(key: string, fallback: any) => any} get
 * @property {(key: string, value: any) => void} set
 */

/**
 * @typedef {Object} LibraryRepository
 * @property {() => Promise<{id:string, show:string, title:string, cat:string, level:string, dur:number, cues:[number,number,string,("screen")?][]}[]>} getAll
 */

/**
 * @typedef {Object} SoundEffects
 * @property {() => void} success
 * @property {() => void} error
 */

/**
 * @typedef {Object} Speech
 * @property {(word: string, audioUrl?: string) => void} say
 */

/**
 * @typedef {Object} TranscriptReader
 * @property {(text: string) => import('../domain/entities/Cue').createCue[]} parse  .srt/.vtt o texto copiado de YouTube
 * @property {(url: string) => string|null} youTubeId
 */

export {};
