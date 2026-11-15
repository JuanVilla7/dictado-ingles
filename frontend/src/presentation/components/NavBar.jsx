import { useEffect, useState } from 'react';
import { useServices } from '../context/services.jsx';
import { useObservable } from '../hooks/useObservable.js';

const TABS = [['home', '🏠 Inicio'], ['games', '🎮 Juegos'], ['words', '⭐ Mis palabras']];

export function NavBar({ view, onNavigate }) {
  const { settings, words } = useServices();
  useObservable(settings); useObservable(words);
  const due = words.due().length;
  const theme = settings.get().theme;
  const [installEvt, setInstallEvt] = useState(null);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const tab = view === 'practice' ? 'home' : view;
  return (
    <header className="nav">
      <div className="nav-in">
        <div className="brand" onClick={() => onNavigate('home')}>
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" /><span>Dictado</span>
        </div>
        <nav className="tabs">
          {TABS.map(([v, label]) => (
            <button key={v} className={tab === v ? 'on' : ''} onClick={() => onNavigate(v)}>
              {label}{v === 'words' && due > 0 && <span className="badge">{due}</span>}
            </button>
          ))}
        </nav>
        {installEvt && <button className="primary" onClick={async () => { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); setInstallEvt(null); }}>⬇ Instalar</button>}
        <button className="icon ghost" title="Cambiar tema" onClick={() => settings.update({ theme: theme === 'dark' ? 'light' : 'dark' })}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
