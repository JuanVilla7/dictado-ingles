const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** `summary` = {done, total, finished}: viene de progress.summary(video) y cuenta solo frases habladas. */
export function VideoCard({ video, summary, onClick }) {
  const { done, total, finished } = summary;
  return (
    <button className="vcard" onClick={onClick}>
      <div className="vthumb" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.id}/mqdefault.jpg)` }}>
        <span className="vdur">{fmtDur(video.dur)}</span>
        <span className="vplay">▶</span>
        {done > 0 && <span className="vprog" style={{ width: `${Math.round((Math.min(done, total) / total) * 100)}%` }} />}
      </div>
      <div className="vbody">
        <div className="vshow">{video.show}</div>
        <div className="vtitle">{video.title}</div>
        <div className="tags">
          <span className="lvl">{video.level}</span>
          <span>{total} frases</span>
          {finished ? <span>· ✔ terminado</span> : done > 0 ? <span>· vas por la {done + 1}</span> : null}
        </div>
      </div>
    </button>
  );
}
