import { useEffect, useState } from 'react';
import { useServices } from './context/services.jsx';
import { useToast } from './context/toast.jsx';
import { useObservable } from './hooks/useObservable.js';
import { useInterval } from './hooks/useInterval.js';
import { NavBar } from './components/NavBar.jsx';
import { VideoStage } from './components/VideoStage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { PracticePage } from './pages/PracticePage.jsx';
import { WordsPage } from './pages/WordsPage.jsx';
import { GamesPage } from './pages/GamesPage.jsx';

/** Raíz de la interfaz: navegación entre pantallas y el video compartido. */
export function App() {
  const { settings, library, practice, games, review, player, progress } = useServices();
  useObservable(settings); useObservable(games); useObservable(practice);
  const toast = useToast();
  const [view, setView] = useState('home');
  const [videos, setVideos] = useState([]);
  const [pendingGame, setPendingGame] = useState(null);

  useEffect(() => { library.load().then(setVideos).catch(() => toast('⚠️ No se pudo cargar la biblioteca.')); }, [library, toast]);
  useEffect(() => { document.documentElement.dataset.theme = settings.get().theme; }, [settings.get().theme]); // eslint-disable-line react-hooks/exhaustive-deps

  // El "reloj" que decide cuándo pausar: solo corre la sesión de la pantalla activa
  useInterval(() => { if (view === 'practice') practice.tick(); else if (view === 'games') games.tick(); }, 50);

  const navigate = (v) => {
    if (view === 'practice' && v !== 'practice') practice.stop();
    if (view === 'games' && v !== 'games') games.stop();
    if (v !== 'words') review.active && review.stop();
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const openVideo = async (video) => {
    games.stop();
    // PracticeSession decide en qué frase hablada empezar y en qué segundo cargar el video
    practice.start({ cues: video.cues, startIndex: progress.get(video.id), videoId: video.id, title: { show: video.show, title: video.title } });
    setView('practice');
    try { await player.loadYouTube(video.id, practice.startTime); player.setRate(settings.get().rate); }
    catch { toast('⚠️ No se pudo cargar YouTube. Revisá tu conexión.'); navigate('home'); }
  };

  const openOwn = async ({ cues, youtubeId, file, startIndex }) => {
    games.stop();
    const start = Math.max(0, cues[startIndex].start - 0.2);
    if (youtubeId) await player.loadYouTube(youtubeId, start); else player.loadFile(file, start);
    player.setRate(settings.get().rate);
    practice.start({ cues, startIndex, videoId: null, title: { show: 'Tu video', title: youtubeId ? 'YouTube' : file.name } });
    setView('practice');
  };

  const playing = view === 'practice' || (view === 'games' && games.active);
  const title = view === 'games' && games.active ? { show: games.round?.video.show, title: games.round?.video.title } : practice.title;

  return (
    <>
      <NavBar view={view} onNavigate={navigate} />
      <main className="wrap">
        <VideoStage visible={playing} compact={view === 'games'} title={title}
          onBack={() => (view === 'games' ? games.stop() : navigate('home'))} />
        {view === 'home' && <HomePage library={videos} onOpenVideo={openVideo} onOpenOwn={openOwn} onNavigate={navigate} />}
        {view === 'practice' && (
          <PracticePage
            onExit={() => navigate('home')}
            onReview={() => { navigate('words'); review.start(); }}
            onPlayGame={() => { const v = library.find(practice.videoId); practice.stop(); setPendingGame({ type: 'listen', videos: [v] }); setView('games'); }} />
        )}
        {view === 'words' && <WordsPage />}
        {view === 'games' && (
          <GamesPage library={videos} pending={pendingGame} clearPending={() => setPendingGame(null)}
            onReviewWords={() => { navigate('words'); review.start(); }} />
        )}
      </main>
    </>
  );
}
