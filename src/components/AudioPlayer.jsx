'use client';
import { useEffect, useRef, useState } from 'react';

// 미션 음성 — 화면에 들어오면 저절로 흐르고, 오른쪽 위 단추로 멈추거나 다시 켠다.
// 파일이 없으면 단추 자체가 나타나지 않는다.
export default function AudioPlayer({ src }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);

  // 아직 화면을 누른 적이 없으면 브라우저가 자동 재생을 막는다.
  // 그때는 조용히 멈춰 있다가 사용자가 단추를 누르면 흐른다.
  useEffect(() => {
    setMissing(false);
    const a = ref.current;
    if (!a) return;
    let onFirstTouch = null;
    a.currentTime = 0;
    a.play().catch(() => {
      // 막혔으면 화면을 처음 건드리는 순간 흐르게 한다(단추를 누를 필요가 없다)
      onFirstTouch = () => a.play().catch(() => {});
      document.addEventListener('pointerdown', onFirstTouch, { once: true });
    });
    return () => { if (onFirstTouch) document.removeEventListener('pointerdown', onFirstTouch); };
  }, [src]);

  if (!src || missing) return null;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <>
      <audio ref={ref} src={src} preload="auto"
             onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
             onEnded={() => setPlaying(false)} onError={() => setMissing(true)} />
      <button type="button" className="audiobtn" onClick={toggle}
              aria-label={playing ? '음성 일시정지' : '음성 듣기'}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {playing
            ? <path d="M7.4 5.2h3.3v13.6H7.4zM13.3 5.2h3.3v13.6h-3.3z" />
            : <path d="M8 5.2v13.6L18.4 12z" />}
        </svg>
      </button>
    </>
  );
}
