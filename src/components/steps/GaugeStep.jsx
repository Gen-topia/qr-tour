'use client';
import { useRef, useState } from 'react';

// 게이지 올리기 — 아래에서 위로 밀어 끝까지 채우면 성공(휴대폰 잠금 해제 제스처).
// config에 { "invert": true }를 두면 거꾸로 — 거의 다 찬 상태에서 위에서 아래로 끌어내려 비운다.
// 손을 떼면 아직 끝나지 않은 만큼 처음 자리로 되돌아간다.
export default function GaugeStep({ step, submit }) {
  const cfg = step.config || {};
  const invert = cfg.invert === true;
  const START = invert ? 0.9 : 0;          // 내리는 방식은 이미 차 있는 상태로 시작한다
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const doneRef = useRef(false);
  const [value, setValue] = useState(START);   // 0~1

  function move(e) {
    if (!draggingRef.current || doneRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    // 트랙 아래쪽이 0, 위쪽이 1
    const v = Math.max(0, Math.min(1, (rect.bottom - t.clientY) / rect.height));
    setValue(v);
    if (invert ? v <= 0.01 : v >= 0.99) {
      doneRef.current = true; draggingRef.current = false; submit({ done: true });
    }
  }

  const start = (e) => { draggingRef.current = true; move(e); };
  const end = () => {
    draggingRef.current = false;
    if (!doneRef.current) setValue(START);   // 끝까지 못 하면 처음 자리로
  };

  return (
    <div className={invert ? 'stack' : 'card stack'}>
      <div className="eyebrow">미션 · 게이지</div>
      <p className="muted" style={{ margin: 0 }}>
        {cfg.label || (invert ? '위에서 아래로 끝까지 끌어내려 주세요.' : '아래에서 위로 끝까지 밀어 올려주세요.')}
      </p>
      <div ref={trackRef} className={`vgauge${invert ? ' vgauge--invert' : ''}`}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
        {cfg.bg_image_url && <img className="vgauge__bg" src={cfg.bg_image_url} alt="" />}
        <div className="vgauge__fill" style={{ height: `${value * 100}%` }} />
        <div className="vgauge__label">{doneRef.current ? '완료!' : `${Math.round(value * 100)}%`}</div>
        <div className="vgauge__arrow">{invert ? '↓' : '↑'}</div>
      </div>
    </div>
  );
}
