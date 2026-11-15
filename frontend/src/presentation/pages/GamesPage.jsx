import { useEffect, useState } from 'react';
import { useServices } from '../context/services.jsx';
import { useToast } from '../context/toast.jsx';
import { useObservable } from '../hooks/useObservable.js';
import { VideoCard } from '../components/VideoCard.jsx';
import { Modal } from '../components/Modal.jsx';
import { resultMessage } from '../../domain/services/games.js';

const INFO = {
  listen: { icon: '👂', title: '¿Qué escuchaste?', desc: 'Suena una frase y elegís cuál de las tres opciones dijeron. Entrena el oído con sonidos que se confunden.', q: 'Escuchá la frase y elegí la opción correcta (teclas 1–3).' },
  order: { icon: '🧩', title: 'Ordená la frase', desc: 'Escuchás la frase y la armás tocando las palabras en el orden correcto.', q: 'Escuchá y tocá las palabras en el orden correcto.' },
};

export function GamesPage({ library, onReviewWords, pending, clearPending }) {
  const { games, words, progress } = useServices();
  useObservable(games); useObservable(words);
  const toast = useToast();
  const [pick, setPick] = useState(null);   // tipo de juego elegido, esperando video

  const start = (type, videos) => {
    if (!games.start(type, videos)) toast('Este video no tiene frases para este juego.');
    setPick(null);
  };
  // Pedido desde otra pantalla (ej. "Jugar con este video" al terminar un dictado)
  useEffect(() => { if (pending) { start(pending.type, pending.videos); clearPending(); } }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  if (games.active) return <GamePlay onExit={() => games.stop()} onOther={() => { const t = games.type; games.stop(); setPick(t); }} />;

  if (pick) return (
    <section className="view">
      <div className="subbar"><button className="ghost" onClick={() => setPick(null)}>← Juegos</button><h2>{INFO[pick].icon} {INFO[pick].title}</h2></div>
      <p className="muted" style={{ marginTop: 0 }}>Elegí de qué video salen las frases (10 rondas).</p>
      <div className="row" style={{ marginBottom: 14 }}><button className="primary" onClick={() => start(pick, library)}>🎲 Mezclar todos los videos</button></div>
      <div className="grid">{library.map((v) => <VideoCard key={v.id} video={v} summary={progress.summary(v)} onClick={() => start(pick, [v])} />)}</div>
    </section>
  );

  const nWords = words.list().length, due = words.due().length;
  return (
    <section className="view">
      <div className="sechead"><h2>🎮 Juegos</h2></div>
      <div className="games">
        {Object.entries(INFO).map(([type, g]) => (
          <button key={type} className="gcard" onClick={() => setPick(type)}>
            <div className="gi">{g.icon}</div><h3>{g.title}</h3><p>{g.desc}</p>
            {games.best[type] != null && <div className="best">🏆 Mejor puntaje: {games.best[type]}/10</div>}
          </button>
        ))}
        <button className="gcard" onClick={onReviewWords}>
          <div className="gi">🧠</div><h3>Repasar mis palabras</h3><p>Las palabras que tocaste o en las que te equivocaste, en tarjetas de repaso.</p>
          <div className="best">{nWords ? `${nWords} palabras · ${due} para repasar` : 'Todavía no guardaste palabras'}</div>
        </button>
      </div>
    </section>
  );
}

function GamePlay({ onExit, onOther }) {
  const { games, translator } = useServices();
  useObservable(games);
  const [tr, setTr] = useState('');
  const round = games.round;

  useEffect(() => { setTr(''); }, [games.i]);
  useEffect(() => {
    if (!games.answered) return undefined;
    let alive = true;
    translator.translate(round.cue.text).then((t) => alive && setTr(t.main));
    return () => { alive = false; };
  }, [games.answered, round, translator]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab') { e.preventDefault(); games.play(); }
      else if (e.key === 'Enter' && games.answered) { e.preventDefault(); games.next(); }
      else if (games.type === 'listen' && !games.answered && /^[1-3]$/.test(e.key)) { const o = games.options[+e.key - 1]; if (o) games.choose(o); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [games]);

  return (
    <section className="view">
      <div className="ghead">
        <span className="muted">Ronda {games.i + 1} de {games.total}</span>
        <div className="gprog"><div style={{ width: `${((games.finished ? games.total : games.i) / games.total) * 100}%` }} /></div>
        <span className="gscore">✔ {games.score}</span>
      </div>
      <div className="gq">{INFO[games.type].q}</div>
      <div className="row" style={{ justifyContent: 'center', marginBottom: 16 }}>
        <button className="primary" onClick={() => games.play()}>🔊 Escuchar de nuevo</button>
        <button onClick={() => games.play(true)}>🐢 Más lento</button>
      </div>

      {games.type === 'listen' ? (
        <div className="opts">
          {games.options.map((o, i) => {
            const right = o === round.cue.text;
            const cls = games.answered ? (right ? 'right' : o === games.chosen ? 'wrong' : '') : '';
            return <button key={o} className={`opt ${cls}`} disabled={games.answered} onClick={() => games.choose(o)}>{i + 1}. {o}</button>;
          })}
        </div>
      ) : (
        <>
          <div className={`answer ${games.answered ? (games.correct ? 'right' : 'wrong') : ''}`}>
            {games.picked.map((ti) => <button key={ti} className="chip" onClick={() => games.unpick(ti)}>{games.tokens[ti]}</button>)}
          </div>
          <div className="bank">
            {games.order.map((ti) => (
              <button key={ti} className={`chip ${games.picked.includes(ti) ? 'used' : ''}`} onClick={() => games.pick(ti)}>{games.tokens[ti]}</button>
            ))}
          </div>
          {games.answered && !games.correct && <div className="solution">✔ {games.tokens.join(' ')}</div>}
          <div className="gfoot"><button onClick={() => games.undo()}>↩ Deshacer</button></div>
        </>
      )}

      <div className="gtr">{tr && `🇪🇸 ${tr}`}</div>
      <div className="gfoot">
        {games.answered && !games.finished && (
          <button className="primary" autoFocus onClick={() => games.next()}>{games.i + 1 < games.total ? 'Siguiente →' : 'Ver resultado'}</button>
        )}
      </div>

      {games.finished && (
        <Modal onClose={onExit}>
          <div className="big">{INFO[games.type].icon}</div><h2>{resultMessage(games.score, games.total)}</h2>
          <div className="sumgrid">
            <div><b>{games.score}/{games.total}</b><span>correctas</span></div>
            <div><b>{games.best[games.type]}/{games.total}</b><span>tu mejor puntaje</span></div>
          </div>
          <div className="btns">
            <button className="primary" onClick={() => games.start(games.type, games.videos)}>🔁 Jugar otra vez</button>
            <button onClick={onOther}>Elegir otro video</button>
            <button onClick={onExit}>Volver a Juegos</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
