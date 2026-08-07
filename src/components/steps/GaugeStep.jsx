'use client';
import { useRef, useState } from 'react';

// 게이지 올리기 — 아래에서 위로 밀어 끝까지 채우면 성공(휴대폰 잠금 해제 제스처).
// 손을 떼면 다 채우지 못한 만큼 되돌아간다.
export default function GaugeStep({ step, submit }) {
  const cfg = step.config || {};
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const doneRef = useRef(false);
  const [value, setValue] = useState(0);   // 0~1

  function move(e) {
    if (!draggingRef.current || doneRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    // 트랙 아래쪽이 0, 위쪽이 1
    const v = Math.max(0, Math.min(1, (rect.bottom - t.clientY) / rect.height));
    setValue(v);
    if (v >= 0.99) { doneRef.current = true; draggingRef.current = false; submit({ done: true }); }
  }

  const start = (e) => { draggingRef.current = true; move(e); };
  const end = () => {
    draggingRef.current = false;
    if (!doneRef.current) setValue(0);   // 끝까지 못 올리면 리셋
  };

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 게이지</div>
      <p className="muted" style={{ margin: 0 }}>{cfg.label || '아래에서 위로 끝까지 밀어 올려주세요.'}</p>
      <div ref={trackRef} className="vgauge"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
        <div className="vgauge__fill" style={{ height: `${value * 100}%` }} />
        <div className="vgauge__label">{doneRef.current ? '완료!' : `${Math.round(value * 100)}%`}</div>
        <div className="vgauge__arrow">↑</div>
      </div>
    </div>
  );
}
