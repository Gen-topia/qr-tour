'use client';
import { useRef, useState } from 'react';

export default function AudioPlayer({ src, label = '성우 안내 듣기' }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  if (!src) return null;
  function toggle() {
    const a = ref.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  return (
    <div className="card center stack">
      <div className="lantern" style={{ width: 44, height: 44 }} />
      <button className="btn ghost" onClick={toggle}>{playing ? '⏸ 일시정지' : `▶ ${label}`}</button>
      <audio ref={ref} src={src} onEnded={() => setPlaying(false)} preload="none" />
    </div>
  );
}
