import { useEffect, useState } from 'react';
import { useServices } from '../context/services.jsx';
import { useObservable } from '../hooks/useObservable.js';
import { Modal } from '../components/Modal.jsx';
import { BOX_DAYS, Grade } from '../../domain/entities/Word.js';

export function WordsPage() {
  const { words, review, phonetics, speech } = useServices();
  useObservable(words); useObservable(review);
  const [done, setDone] = useState(false);
  useEffect(() => { if (review.finished) setDone(true); }, [review.finished, review.version]);

  if (review.active) return <ReviewCards />;

  const list = words.list();
  const due = words.due().length;
  return (
    <section className="view">
      <div className="whead">
        <div><h2>⭐ Mis palabras</h2>
          <div className="muted">{list.length ? `${list.length} palabras · ${due ? `${due} para repasar hoy` : 'nada pendiente hoy 🎉'}` : ''}</div></div>
        {list.length > 0 && <button className="primary" onClick={() => review.start()}>{due ? `🧠 Repasar (${due})` : '🧠 Repasar igual'}</button>}
      </div>
      <div className="wlist">
        {!list.length && (
          <div className="empty card"><div className="big">⭐</div><b>Todavía no guardaste palabras</b>
            <p>Mientras practicás, tocá una palabra ya escrita para traducirla: se guarda acá. También se guardan las que te cuestan (cuando usás una pista o fallás 3 veces).</p></div>
        )}
        {list.map((w) => (
          <div className="witem" key={w.key}>
            <span className="ww" style={{ cursor: 'pointer' }} onClick={() => phonetics.lookup(w.w).then((p) => speech.say(w.w, p?.audio))}>{w.w}</span>
            <span className="wt">{w.tr || '…'}</span>
            <span className="dots">{BOX_DAYS.slice(1).map((_, i) => <i key={i} className={w.box > i ? 'on' : ''} />)}</span>
            <button className="del" title="Quitar" onClick={() => words.remove(w.w)}>✕</button>
          </div>
        ))}
      </div>
      {done && (
        <Modal onClose={() => setDone(false)}>
          <div className="big">🧠</div><h2>¡Repaso terminado!</h2>
          <p className="muted">Las palabras que sabías vuelven en unos días; las difíciles, antes.</p>
          <div className="btns"><button className="primary" onClick={() => setDone(false)}>Listo</button></div>
        </Modal>
      )}
    </section>
  );
}

function highlight(ctx, word) {
  if (!ctx) return null;
  const i = ctx.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return <>“{ctx}”</>;
  return <>“{ctx.slice(0, i)}<mark>{ctx.slice(i, i + word.length)}</mark>{ctx.slice(i + word.length)}”</>;
}

function ReviewCards() {
  const { review, words, phonetics, speech } = useServices();
  const card = review.current;
  const [ph, setPh] = useState(null);
  const [tr, setTr] = useState('');
  useEffect(() => {
    if (!card) return undefined;
    let alive = true;
    setPh(null); setTr(card.tr || '');
    phonetics.lookup(card.w).then((p) => { if (!alive) return; setPh(p); speech.say(card.w, p?.audio); });
    if (!card.tr) words.ensureTranslation(card.key).then((t) => alive && setTr(t));
    return () => { alive = false; };
  }, [card?.key, review.i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); review.revealed ? review.grade(Grade.GOOD) : review.reveal(); }
      else if (e.key === '1') review.grade(Grade.AGAIN);
      else if (e.key === '2') review.grade(Grade.GOOD);
      else if (e.key === '3') review.grade(Grade.EASY);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [review]);

  if (!card) return null;
  return (
    <section className="view">
      <div className="fc-top">
        <button className="ghost" onClick={() => review.stop()}>← Terminar</button>
        <span className="muted">{Math.min(review.i + 1, review.queue.length)} / {review.queue.length}</span>
      </div>
      <div className="card flash-card">
        <div className="fc-word">{card.w}</div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="fc-ipa">{ph?.ipa}</span>
          <button className="icon" onClick={() => speech.say(card.w, ph?.audio)}>🔊</button>
        </div>
        <div className="fc-ctx">{highlight(card.ctx, card.w)}</div>
        {review.revealed ? (
          <>
            <div className="fc-tr">{tr || '…'}</div>
            <div className="fc-btns">
              <button onClick={() => review.grade(Grade.AGAIN)}>😕 No me acordaba</button>
              <button className="primary" onClick={() => review.grade(Grade.GOOD)}>🙂 Bien</button>
              <button onClick={() => review.grade(Grade.EASY)}>😎 Fácil</button>
            </div>
          </>
        ) : (
          <div className="fc-btns"><button className="primary" onClick={() => review.reveal()}>Mostrar significado</button></div>
        )}
      </div>
    </section>
  );
}
