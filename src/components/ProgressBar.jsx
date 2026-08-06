'use client';
export default function ProgressBar({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="stack">
      <div className="spread"><span className="muted">진행도</span><span className="muted">{done} / {total}</span></div>
      <div className="gauge"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
