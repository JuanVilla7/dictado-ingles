import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useServices } from '../context/services.jsx';

/** Ventanita al tocar una palabra: traducción, IPA, audio y (si hay) traducción de la frase. */
export function TranslationPopup({ word, sentence, rect, onClose }) {
  const { translator, phonetics, speech, words } = useServices();
  const [tr, setTr] = useState(null);
  const [sentTr, setSentTr] = useState('');
  const [ph, setPh] = useState(null);
  const [saved, setSaved] = useState(true);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    setTr(null); setPh(null); setSentTr(''); setSaved(true);
    translator.translate(word).then((t) => alive && setTr(t));
    phonetics.lookup(word).then((p) => alive && setPh(p));
    if (sentence) translator.translate(sentence).then((t) => alive && setSentTr(t.main));
    return () => { alive = false; };
  }, [word, sentence, translator, phonetics]);

  useLayoutEffect(() => {
    const w = ref.current?.offsetWidth || 320;
    setPos({
      left: Math.max(8, Math.min(rect.left + window.scrollX + rect.width / 2 - w / 2, window.scrollX + window.innerWidth - w - 8)),
      top: rect.bottom + window.scrollY + 8,
    });
  }, [rect]);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [onClose]);

  return (
    <div className="pop" ref={ref} style={pos}>
      <button className="x" title="Cerrar" onClick={onClose}>✕</button>
      <div className="ph">
        <span className="pw">{word}</span>
        <span className="ipa">{ph?.ipa}</span>
        <button className="say" title="Escuchar" onClick={() => speech.say(word, ph?.audio)}>🔊</button>
      </div>
      <div className="tr">{tr ? tr.main || 'Sin traducción' : 'Traduciendo…'}</div>
      <div className="alt">
        {tr?.alternatives.slice(0, 2).map((a) => <div key={a.pos}><b>{a.pos}:</b> {a.terms.join(', ')}</div>)}
      </div>
      {sentence && <div className="sent">Frase: <span>{sentTr || '…'}</span></div>}
      <div className="saved">
        {saved
          ? <><span>⭐ Guardada en Mis palabras</span><button onClick={() => { words.remove(word); setSaved(false); }}>Quitar</button></>
          : <span className="muted">Quitada de Mis palabras</span>}
      </div>
    </div>
  );
}
