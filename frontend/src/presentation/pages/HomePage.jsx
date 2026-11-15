import { useState } from 'react';
import { useServices } from '../context/services.jsx';
import { useObservable } from '../hooks/useObservable.js';
import { VideoCard } from '../components/VideoCard.jsx';

const CATEGORIES = [['', 'Todos'], ['pelicula', '🎬 Películas'], ['ciencia', '🚀 Ciencia']];

export function HomePage({ library, onOpenVideo, onOpenOwn, onNavigate }) {
  const { stats, words, progress } = useServices();
  useObservable(stats); useObservable(words);
  const [cat, setCat] = useState('');
  const today = stats.today();
  const streak = stats.streak();
  const due = words.due().length;
  const hour = new Date().getHours();
  const hello = hour < 12 ? '¡Buen día!' : hour < 20 ? '¡Buenas tardes!' : '¡Buenas noches!';
  const inProgress = library.filter((v) => { const p = progress.get(v.id); return p > 0 && p < v.cues.length; });

  return (
    <section className="view">
      <div className="hello">
        <div><h1>{hello} 👋</h1><div className="muted">Elegí un video, escuchá y escribí lo que dicen.</div></div>
      </div>
      <div className="stats">
        <div className="stat"><div className="n">🔥 {streak}</div><div className="l">{streak === 1 ? 'día de racha' : 'días de racha'}</div></div>
        <div className="stat"><div className="n">✍️ {today.phr}</div><div className="l">frases hoy</div></div>
        <div className="stat"><div className="n">🎯 {today.keys ? `${Math.round((today.good / today.keys) * 100)}%` : '—'}</div><div className="l">precisión hoy</div></div>
        <div className="stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('words')}>
          <div className="n">⭐ {words.list().length}</div><div className="l">{due ? `${due} palabras para repasar` : 'palabras guardadas'}</div>
        </div>
      </div>

      {inProgress.length > 0 && <>
        <div className="sechead"><h2>▶ Seguir viendo</h2></div>
        <div className="grid">{inProgress.map((v) => <VideoCard key={v.id} video={v} done={progress.get(v.id)} onClick={() => onOpenVideo(v)} />)}</div>
      </>}

      <div className="sechead">
        <h2>📚 Biblioteca</h2>
        <div className="chips">
          {CATEGORIES.map(([c, label]) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{label}</button>)}
        </div>
      </div>
      <div className="grid">
        {library.length === 0 && <p className="muted">Cargando videos…</p>}
        {library.filter((v) => !cat || v.cat === cat).map((v) => <VideoCard key={v.id} video={v} done={progress.get(v.id)} onClick={() => onOpenVideo(v)} />)}
      </div>
      <p className="credit">Escenas de <i>Charade</i> (1963) y videos de NASA, ambos de dominio público.</p>

      <OwnVideoForm onStart={onOpenOwn} />
    </section>
  );
}

/** Formulario para practicar con un video propio de YouTube (o un archivo) pegando su transcripción. */
function OwnVideoForm({ onStart }) {
  const { progress, transcripts } = useServices();
  const saved = progress.getOwn();
  const [url, setUrl] = useState(saved.url);
  const [file, setFile] = useState(null);
  const [text, setText] = useState(saved.transcript);
  const [msg, setMsg] = useState({ text: '', err: false });

  const start = async (resume) => {
    const cues = transcripts.parse(text);
    if (!cues.length) return setMsg({ text: 'Pegá la transcripción del video (con los tiempos) o cargá un .srt.', err: true });
    const id = transcripts.youTubeId(url);
    if (!id && !file) return setMsg({ text: 'Pegá un link de YouTube o elegí un archivo de video.', err: true });
    setMsg({ text: 'Cargando…', err: false });
    progress.setOwn({ url: url.trim(), transcript: text });
    try {
      await onStart({ cues, youtubeId: file ? null : id, file, startIndex: resume ? Math.min(saved.index, cues.length - 1) : 0 });
      setMsg({ text: '', err: false });
    } catch {
      setMsg({ text: '⚠️ No se pudo cargar YouTube. Revisá tu conexión.', err: true });
    }
  };

  return (
    <details className="own card">
      <summary>➕ Usar mi propio video de YouTube</summary>
      <div className="step">
        <h3>1 · Video</h3>
        <div className="row">
          <input type="text" value={url} onChange={(e) => { setUrl(e.target.value); setFile(null); }} placeholder="Pegá el link de YouTube: https://www.youtube.com/watch?v=…" style={{ flex: 1, minWidth: 220 }} />
          <span className="muted">o</span>
          <label className="btn">📁 Archivo<input type="file" accept="video/*,audio/*" hidden onChange={(e) => { setFile(e.target.files[0] || null); if (e.target.files[0]) setUrl(''); }} /></label>
        </div>
        {file && <div className="muted" style={{ marginTop: 6 }}>📁 {file.name}</div>}
      </div>
      <div className="step">
        <h3>2 · Transcripción</h3>
        <p className="muted" style={{ margin: '0 0 8px' }}>En YouTube, debajo del video: <b>…más → Mostrar transcripción</b>. Copiá todo el texto del panel (con los tiempos) y pegalo acá. También podés cargar un .srt / .vtt.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'0:00\nTell me what you did yesterday.\n0:03\nI went to the office…'} />
        <div className="row" style={{ marginTop: 8 }}>
          <label className="btn">📄 Cargar .srt / .vtt<input type="file" accept=".srt,.vtt,text/vtt" hidden onChange={(e) => e.target.files[0]?.text().then(setText)} /></label>
        </div>
      </div>
      <div className="row">
        <button className="primary" onClick={() => start(false)}>▶ Empezar</button>
        {saved.url && saved.transcript && saved.index > 0 && <button onClick={() => start(true)}>↩ Seguir donde quedé</button>}
      </div>
      <div className={`msg ${msg.err ? 'err' : ''}`}>{msg.text}</div>
    </details>
  );
}
