'use client';
import { useEffect, useRef, useState } from 'react';

// 문지르기 — 캔버스 덮개를 손가락으로 지운다. 지워진 비율이 threshold를 넘으면 성공.
export default function ScratchStep({ step, submit }) {
  const cfg = step.config || {};
  const threshold = Number(cfg.threshold ?? 0.7);
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const drawingRef = useRef(false);
  const [pct, setPct] = useState(0);

  // 덮개를 그린다 (표시 크기와 픽셀 크기를 맞춰 좌표가 어긋나지 않게)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(rect.width * dpr);
    cv.height = Math.round(rect.height * dpr);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = cfg.cover_color || '#c9cede';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [cfg.cover_color]);

  // 투명해진 픽셀 비율을 센다 (성능을 위해 격자로 샘플링)
  function measure() {
    const cv = canvasRef.current;
    if (!cv) return 0;
    const ctx = cv.getContext('2d');
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
    let clear = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] < 40) clear++; }
    return total ? clear / total : 0;
  }

  function erase(e) {
    if (!drawingRef.current || doneRef.current) return;
    const cv = canvasRef.current;
    const rect = cv.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const ctx = cv.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    const p = measure();
    setPct(p);
    if (p >= threshold) { doneRef.current = true; submit({ done: true }); }
  }

  const start = (e) => { drawingRef.current = true; erase(e); };
  const stop = () => { drawingRef.current = false; };

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 문지르기</div>
      <p className="muted" style={{ margin: 0 }}>손가락으로 문질러 가려진 그림을 드러내 주세요.</p>
      <div className="scratch">
        {cfg.reveal_image_url
          ? <img className="scratch__under" src={cfg.reveal_image_url} alt="" />
          : <div className="scratch__under scratch__under--ph">🎁</div>}
        <canvas ref={canvasRef} className="scratch__cover"
          onMouseDown={start} onMouseMove={erase} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={erase} onTouchEnd={stop} />
      </div>
      <div className="gauge"><i style={{ width: `${Math.min(100, (pct / threshold) * 100)}%` }} /></div>
    </div>
  );
}
