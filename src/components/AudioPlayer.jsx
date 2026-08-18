'use client';
import { useEffect, useRef, useState } from 'react';

// 음성 파일은 나중에 채워 넣는다. 아직 없는 파일이면 재생 버튼을 아예 보여주지 않는다.
export default function AudioPlayer({ src, label = '성우 안내 듣기' }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);
  useEffect(() => { setMissing(false); setPlaying(false); }, [src]);
  if (!src || missing) return null;
  function toggle() {
    const a = ref.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  return (
    <div className="card center stack">
      <div className="lantern" style={{ width: 44, height: 44 }} />
      <button className="btn ghost" onClick={toggle}>{playing ? '⏸ 일시정지' : `▶ ${label}`}</button>
      <audio ref={ref} src={src} preload="metadata"
             onEnded={() => setPlaying(false)} onError={() => setMissing(true)} />
    </div>
  );
}
