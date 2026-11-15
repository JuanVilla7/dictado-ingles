import { useEffect, useRef } from 'react';
import { useServices } from '../context/services.jsx';
import { useToast } from '../context/toast.jsx';

/**
 * Lugar donde se dibuja el video. Se monta UNA sola vez y se oculta/muestra con CSS:
 * si React lo desmontara, el iframe de YouTube se recargaría y perderíamos el reproductor.
 */
export function VideoStage({ visible, compact, title, onBack }) {
  const { player } = useServices();
  const toast = useToast();
  const ytRef = useRef(null), videoRef = useRef(null);
  useEffect(() => {
    player.mount({ youtubeHost: ytRef.current, videoElement: videoRef.current, onError: (m) => toast('⚠️ ' + m) });
  }, [player, toast]);
  const src = player.source;
  return (
    <section id="playerArea" className={`${visible ? '' : 'hidden'} ${compact ? 'compact' : ''}`}>
      <div className="subbar">
        <button className="ghost" onClick={onBack}>← Volver</button>
        <div className="subtitle"><small>{title?.show}</small><b>{title?.title}</b></div>
      </div>
      <div className="stage">
        <div id="ytWrap" className={src === 'file' ? 'hidden' : ''}><div ref={ytRef} /></div>
        <video ref={videoRef} controls playsInline className={src === 'file' ? '' : 'hidden'} />
      </div>
    </section>
  );
}
