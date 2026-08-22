'use client';
import { useEffect, useRef, useState } from 'react';

// 소원지 쓰기 — 종이 그림 위에 손가락으로 글씨를 쓰고, 다 쓰면 단추로 넘어간다.
// config: { "bg_image_url": "/wish/paper.png", "cta": "소원지 달기",
//           "line_color": "#2b2b2b", "line_width": 4 }
// (Pointer Event 하나로 마우스·터치·펜을 함께 처리한다)
export default function DrawStep({ step, submit }) {
  const cfg = step.config || {};
  const canvasRef = useRef(null);
  const inkRef = useRef(false);
  const lastRef = useRef(null);
  const [busy, setBusy] = useState(false);

  // 캔버스는 CSS 크기와 화면 배율에 맞춰 픽셀을 잡아야 글씨가 흐려지지 않는다
  useEffect(() => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Number(cfg.line_width) || 4;
    ctx.strokeStyle = cfg.line_color || '#2b2b2b';
  }, [cfg.line_color, cfg.line_width]);

  const at = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    inkRef.current = true;
    lastRef.current = at(e);
  }

  function move(e) {
    if (!inkRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const p = at(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  }

  const up = () => { inkRef.current = false; };

  const erase = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  };

  async function hang() {
    setBusy(true);
    await submit({ done: true });
    setBusy(false);
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 소원지 쓰기</div>
      <p className="muted" style={{ margin: 0 }}>{cfg.label || '손가락으로 글씨를 작성해 주세요.'}</p>
      <div className="wish">
        {cfg.bg_image_url && <img className="wish__paper" src={cfg.bg_image_url} alt="" />}
        <canvas ref={canvasRef} className="wish__ink"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      </div>
      <button type="button" className="btn ghost" onClick={erase}>다시 쓰기</button>
      <button type="button" className="btn" disabled={busy} onClick={hang}>{cfg.cta || '소원지 달기'}</button>
    </div>
  );
}
