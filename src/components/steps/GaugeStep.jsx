'use client';
import { useRef, useState } from 'react';

// 게이지 올리기 — 아래에서 위로 밀어 끝까지 채우면 성공(휴대폰 잠금 해제 제스처).
// config에 { "invert": true }를 두면 거꾸로 — 거의 다 찬 상태에서 수위를 잡아 아래로 끌어내려 비운다.
// 어느 쪽이든 채운 높이는 트랙 아래쪽에서 잰다(눈금과 같은 방향).
// scale_top·scale_bottom을 적어 두면 기압표처럼 눈금과 수치를 함께 보여준다.
// 손을 떼면 아직 끝나지 않은 만큼 처음 자리로 되돌아간다.
const TICKS = 5;
const GRAB = 0.18;               // 내리는 방식에서 '수위를 잡았다'고 볼 범위(트랙 높이 대비)

export default function GaugeStep({ step, submit }) {
  const cfg = step.config || {};
  const invert = cfg.invert === true;
  const START = invert ? 0.9 : 0;          // 내리는 방식은 이미 차 있는 상태로 시작한다
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const doneRef = useRef(false);
  const [value, setValue] = useState(START);   // 0~1

  // 눈금이 있으면 백분율 대신 그 단위(기압 등)로 읽어 준다
  const top = Number(cfg.scale_top), bottom = Number(cfg.scale_bottom);
  const scaled = Number.isFinite(top) && Number.isFinite(bottom);
  const reading = scaled
    ? `${Math.round(bottom + (top - bottom) * value)}${cfg.unit ? ` ${cfg.unit}` : ''}`
    : `${Math.round(value * 100)}%`;

  function move(e) {
    if (!draggingRef.current || doneRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    // 트랙 아래쪽이 0, 위쪽이 1 — 손가락 높이가 곧 수위다
    const v = Math.max(0, Math.min(1, (rect.bottom - t.clientY) / rect.height));
    setValue(v);
    if (invert ? v <= 0.01 : v >= 0.99) {
      doneRef.current = true; draggingRef.current = false; submit({ done: true });
    }
  }

  const start = (e) => {
    // 내리는 방식은 지금 수위 근처를 짚어야 잡힌다.
    // (아무 데나 누르면 그 높이로 값이 튀어 아래쪽을 건드리는 것만으로 끝나 버린다)
    if (invert) {
      const rect = trackRef.current.getBoundingClientRect();
      const t = e.touches?.[0] || e;
      if (Math.abs((rect.bottom - t.clientY) / rect.height - value) > GRAB) return;
    }
    draggingRef.current = true;
    move(e);
  };
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
      <div ref={trackRef}
        className={`vgauge${invert ? ' vgauge--invert' : ''}${cfg.bg_image_url ? ' vgauge--art' : ''}`}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
        {cfg.bg_image_url && <img className="vgauge__bg" src={cfg.bg_image_url} alt="" />}
        {/* 채우는 그림이 있으면 아래에서부터 차오르게 잘라 보여준다(항아리에 물 붓듯) */}
        {cfg.fill_image_url
          ? <img className="vgauge__water" src={cfg.fill_image_url} alt=""
                 style={{ clipPath: `inset(${(1 - value) * 100}% 0 0 0)` }} />
          : <div className="vgauge__fill" style={{ height: `${value * 100}%` }} />}

        {/* 기압표 눈금 — 위가 scale_top, 아래가 scale_bottom */}
        {scaled && (
          <div className="vgauge__scale" aria-hidden="true">
            {Array.from({ length: TICKS }, (_, i) => (
              <span key={i} style={{ top: `${(i / (TICKS - 1)) * 100}%` }}>
                {Math.round(top - (top - bottom) * i / (TICKS - 1))}
              </span>
            ))}
          </div>
        )}
        {cfg.top_label && <div className="vgauge__cap vgauge__cap--top">{cfg.top_label}</div>}
        {cfg.bottom_label && <div className="vgauge__cap vgauge__cap--bottom">{cfg.bottom_label}</div>}

        <div className="vgauge__label">{doneRef.current ? '완료!' : reading}</div>
        <div className="vgauge__arrow">{invert ? '↓' : '↑'}</div>
      </div>
    </div>
  );
}
