/**
 * RAÍZ DE COMPOSICIÓN: el único lugar que conoce TODAS las capas.
 * Acá se crean las implementaciones concretas (infraestructura) y se inyectan en los casos de uso.
 * Para cambiar, por ejemplo, el traductor, solo se toca esta línea.
 */
import { createRoot } from 'react-dom/client';
import './presentation/styles/app.css';

// Infraestructura
import { LocalStore } from './infrastructure/storage/LocalStore.js';
import { MediaPlayer } from './infrastructure/player/MediaPlayer.js';
import { GoogleTranslator } from './infrastructure/translation/GoogleTranslator.js';
import { FreeDictionaryPhonetics } from './infrastructure/translation/FreeDictionaryPhonetics.js';
import { StaticLibraryRepository } from './infrastructure/library/StaticLibraryRepository.js';
import { WebAudioSounds } from './infrastructure/audio/WebAudioSounds.js';
import { BrowserSpeech } from './infrastructure/audio/BrowserSpeech.js';
import { parseTranscript, youTubeIdFrom } from './infrastructure/transcripts/transcriptParser.js';

// Casos de uso
import { SettingsService } from './application/usecases/SettingsService.js';
import { StatsService } from './application/usecases/StatsService.js';
import { WordsService } from './application/usecases/WordsService.js';
import { ProgressService } from './application/usecases/ProgressService.js';
import { LibraryService } from './application/usecases/LibraryService.js';
import { PracticeSession } from './application/usecases/PracticeSession.js';
import { GameSession } from './application/usecases/GameSession.js';
import { ReviewSession } from './application/usecases/ReviewSession.js';

// Presentación
import { ServicesProvider } from './presentation/context/services.jsx';
import { ToastProvider } from './presentation/context/toast.jsx';
import { App } from './presentation/App.jsx';

const store = new LocalStore();
const translator = new GoogleTranslator();
const player = new MediaPlayer();
const settings = new SettingsService(store);
const sounds = new WebAudioSounds(() => settings.get().sound);
const stats = new StatsService(store);
const words = new WordsService(store, translator);
const progress = new ProgressService(store);

const services = {
  store, translator, player, settings, sounds, stats, words, progress,
  phonetics: new FreeDictionaryPhonetics(),
  speech: new BrowserSpeech(),
  transcripts: { parse: parseTranscript, youTubeId: youTubeIdFrom },
  library: new LibraryService(new StaticLibraryRepository()),
  practice: new PracticeSession({ player, stats, words, progress, settings, sounds }),
  games: new GameSession({ player, stats, sounds, store }),
  review: new ReviewSession({ words, stats, sounds }),
};

createRoot(document.getElementById('root')).render(
  <ServicesProvider value={services}>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ServicesProvider>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
