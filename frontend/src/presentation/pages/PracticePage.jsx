import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from '../context/services.jsx';
import { useToast } from '../context/toast.jsx';
import { useObservable } from '../hooks/useObservable.js';
import { useInterval } from '../hooks/useInterval.js';
import { TranslationPopup } from '../components/TranslationPopup.jsx';
import { Modal } from '../components/Modal.jsx';

const fmt = (s) => {
  s = Math.floor(s || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
};

/** Pantalla de dictado: la frase con huecos, la caja para escribir y los controles. */
export function PracticePage({ onExit, onPlayGame, onReview }) {
  const { practice, settings, player, words } = useServices();
  useObservable(practice); useObservable(settings);
  const toast = useToast();
  const s = settings.get();
  const typerRef = useRef(null);
  const [popup, setPopup] = useState(null);         // {word, sentence, rect}
  const [showSettings, setShowSettings] = useState(false);
  const [clock, setClock] = useState({ t: 0, d: 0, paused: true });
  const [flash, setFlash] = useState(false);

  useInterval(() => setClock({ t: player.currentTime(), d: player.duration(), paused: player.isPaused() }), 200);

  // Animación al completar una frase
  useEffect(() => {
    if (!practice.flash) return undefined;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 450);
    return () => clearTimeout(t);
  }, [practice.flash]);

  // Aviso cuando una palabra difícil se guarda sola
  useEffect(() => { if (practice.lastSaved) toast(`⭐ "${practice.lastSaved.word}" se guardó en Mis palabras`); }, [practice.lastSaved, toast]);

  // Al cambiar de frase se cierra la ventanita de traducción
  useEffect(() => setPopup(null), [practice.index]);

  const focus = () => typerRef.current?.focus();
  const closePopup = useCallback(() => { setPopup(null); typerRef.current?.focus(); }, []);

  const openWord = (e, word, sentence) => {
    e.stopPropagation();
    if (!player.isPaused()) player.pause();
    practice.saveTappedWord(word, sentence || practice.cue?.text || '');
    setPopup({ word, sentence, rect: e.currentTarget.getBoundingClientRect() });
  };

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'SELECT' || tag === 'TEXTAREA' || (tag === 'INPUT' && e.target !== typerRef.current)) return;
      if (e.key === 'Tab') { e.preventDefault(); practice.replay(); focus(); }
      else if (e.key === 'Escape' || (e.ctrlKey && e.key === ' ')) { e.preventDefault(); if (popup) closePopup(); else practice.togglePlay(); }
      else if (e.key === 'Enter' && e.target === typerRef.current) { e.preventDefault(); practice.skip(); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'h') { e.preventDefault(); practice.hint(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [practice, popup, closePopup]);

  // Si se hace clic en el video de YouTube, el foco vuelve a la caja de escritura
  useEffect(() => {
    const onBlur = () => setTimeout(() => { if (document.activeElement?.tagName === 'IFRAME') focus(); }, 150);
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  const line = practice.line;
  const prev = practice.previousCue;

  return (
    <section className="view">
      <div className="pbar">
        <div className="pstats">
          <div className="pstat"><small>Frase</small><b>{Math.min(practice.index + 1, practice.cues.length)}/{practice.cues.length}</b></div>
          <div className="pstat"><small>WPM</small><b>{practice.wpm}</b></div>
          <div className="pstat"><small>Precisión</small><b>{practice.accuracy}%</b></div>
        </div>
        <div className="ctrls">
          <button title="Volver a la primera frase" onClick={() => { practice.goTo(0); focus(); }}>⏮</button>
          <button title="Frase anterior" onClick={() => { practice.goTo(practice.index - 1); focus(); }}>‹</button>
          <button className="primary" title="Play / pausa (Esc)" onClick={() => { practice.togglePlay(); focus(); }}>{clock.paused ? '▶' : '⏸'}</button>
          <button title="Repetir (Tab)" onClick={() => { practice.replay(); focus(); }}>↺ {s.win}s</button>
          <button title="Frase siguiente" onClick={() => { practice.goTo(practice.index + 1); focus(); }}>›</button>
        </div>
      </div>
      <div className="progress"><div style={{ width: clock.d ? `${(clock.t / clock.d) * 100}%` : 0 }} /></div>
      <div className="time">{fmt(clock.t)} / {fmt(clock.d)}</div>

      {prev && <PreviousLine cue={prev} onWord={(e, w) => openWord(e, w, prev.text)} />}

      <div className={`line mode-${s.mode} ${flash ? 'flash' : ''}`}>
        {line ? <LineView line={line} mode={s.mode} lastError={practice.lastError} onWord={(e, w) => openWord(e, w, null)} />
              : <div className="end">🎉 ¡Terminaste el video!</div>}
      </div>
      <div className={`status ${line?.done ? 'done' : ''}`}>{practice.status}</div>
      <input ref={typerRef} id="typer" type="text" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" autoFocus
        placeholder="Escribí aquí…" value=""
        onChange={(e) => { for (const ch of e.target.value) practice.type(ch); }} />

      <div className="actions">
        <button title="Revelar la letra (Ctrl+H)" onClick={() => { practice.hint(); focus(); }}>💡 Pista</button>
        <button title="Revelar y pasar (Enter)" onClick={() => { practice.skip(); focus(); }}>⏭ Saltar</button>
        <button title="Ajustes" onClick={(e) => { e.stopPropagation(); setShowSettings((v) => !v); }}>⚙ Ajustes</button>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </div>
      <div className="keys">
        <kbd>Tab</kbd> repetir · <kbd>Esc</kbd> play/pausa · <kbd>Enter</kbd> revelar y pasar · <kbd>Ctrl</kbd>+<kbd>H</kbd> pista · tocá una palabra ya escrita para traducirla
      </div>

      {popup && <TranslationPopup {...popup} onClose={closePopup} />}

      {practice.finished && (
        <Modal onClose={onExit}>
          <div className="big">🎉</div><h2>¡Terminaste el video!</h2>
          <div className="sumgrid">
            <div><b>{practice.completedCount}</b><span>frases completadas</span></div>
            <div><b>{practice.accuracy}%</b><span>precisión</span></div>
            <div><b>{practice.session.newWords}</b><span>palabras nuevas guardadas</span></div>
            <div><b>{Math.max(1, Math.round(practice.session.activeMs / 60000))} min</b><span>escribiendo</span></div>
          </div>
          <div className="btns">
            {practice.videoId && <button className="primary" onClick={onPlayGame}>👂 Jugar ¿Qué escuchaste? con este video</button>}
            {words.due().length > 0 && <button onClick={onReview}>🧠 Repasar mis palabras</button>}
            <button onClick={onExit}>🏠 Volver al inicio</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

/** Dibuja la frase letra por letra según el estado del dominio (DictationLine). */
function LineView({ line, mode, lastError, onWord }) {
  return line.words.map((w, wi) => {
    const tappable = !!w.word && (mode === 'full' || line.isWordComplete(wi));
    return (
      <span key={wi} className={`word ${tappable ? 'tap' : ''}`} onClick={tappable ? (e) => onWord(e, w.word) : undefined}>
        {w.chars.map((c, ci) => {
          if (c.letterIndex < 0) return <span key={ci} className="punct">{c.ch}</span>;
          const l = line.letters[c.letterIndex];
          const cur = c.letterIndex === line.pos && !line.done;
          const err = cur && lastError?.pos === c.letterIndex;
          return (
            <span key={err ? `${ci}-${lastError.n}` : ci} className={`ch ${l.mark || 'pending'} ${cur ? 'cur' : ''} ${err ? 'err' : ''}`}>
              {c.ch}
            </span>
          );
        })}
      </span>
    );
  });
}

/** Frase anterior, chiquita: todas sus palabras se pueden tocar y se puede traducir entera. */
function PreviousLine({ cue, onWord }) {
  const { translator } = useServices();
  const [tr, setTr] = useState('');
  useEffect(() => setTr(''), [cue]);
  return (
    <>
      <div className="prev">
        {cue.text.split(/\s+/).filter(Boolean).map((part, i) => {
          const w = part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
          return <span key={i}>{i > 0 && ' '}<span className={`word ${w ? 'tap' : ''}`} onClick={w ? (e) => onWord(e, w) : undefined}>{part}</span></span>;
        })}
        {' '}<button className="tbtn" title="Traducir la frase" onClick={(e) => { e.stopPropagation(); if (tr) setTr(''); else { setTr('…'); translator.translate(cue.text).then((t) => setTr(t.main)); } }}>🌐</button>
      </div>
      <div className="prevtr">{tr}</div>
    </>
  );
}

function SettingsPanel({ onClose }) {
  const { settings, player } = useServices();
  const s = settings.get();
  useEffect(() => {
    const t = setTimeout(() => document.addEventListener('click', onClose), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', onClose); };
  }, [onClose]);
  return (
    <div className="panel" onClick={(e) => e.stopPropagation()}>
      <h4>Ajustes</h4>
      <div className="set"><span>👁 Ver la frase</span>
        <select value={s.mode} onChange={(e) => settings.update({ mode: e.target.value })}>
          <option value="gaps">Huecos de letras</option><option value="full">Subtítulo completo</option><option value="hidden">Sin pistas</option>
        </select></div>
      <div className="set"><span>↺ Tab repite</span>
        <select value={s.win} onChange={(e) => settings.update({ win: +e.target.value })}>
          {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} s</option>)}
        </select></div>
      <div className="set"><span>🐢 Velocidad</span>
        <select value={s.rate} onChange={(e) => { settings.update({ rate: +e.target.value }); player.setRate(+e.target.value); }}>
          {[0.5, 0.75, 1, 1.25].map((n) => <option key={n} value={n}>{n}×</option>)}
        </select></div>
      <div className="set"><span>⏸ Pausar al final de cada frase</span>
        <input type="checkbox" checked={s.autoPause} onChange={(e) => settings.update({ autoPause: e.target.checked })} /></div>
      <div className="set"><span>🔔 Sonidos</span>
        <input type="checkbox" checked={s.sound} onChange={(e) => settings.update({ sound: e.target.checked })} /></div>
    </div>
  );
}
