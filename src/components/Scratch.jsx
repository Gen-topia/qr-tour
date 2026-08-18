'use client';
import { useEffect, useRef } from 'react';

// 문지르기 덮개 — children 위에 캔버스를 덮고 손가락으로 지운다.
// 지워진 비율(0~1)을 onProgress로 알린다. 판정은 쓰는 쪽에서 한다.
export default function Scratch({ className = 'scratch', cover = '#c9cede', radius = 22, onProgress, children }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  // 덮개를 그린다 (표시 크기와 픽셀 크기를 맞춰 좌표가 어긋나지 않게)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // 열림 애니메이션의 transform에 영향받지 않도록 레이아웃 크기를 쓴다
    const w = cv.offsetWidth, h = cv.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = cover;
    ctx.fillRect(0, 0, w, h);
  }, [cover]);

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
    if (!drawingRef.current) return;
    const cv = canvasRef.current;
    const rect = cv.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const ctx = cv.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    onProgress?.(measure());
  }

  const start = (e) => { drawingRef.current = true; erase(e); };
  const stop = () => { drawingRef.current = false; };

  return (
    <div className={className}>
      {children}
      <canvas ref={canvasRef} className="scratch__cover"
        onMouseDown={start} onMouseMove={erase} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={erase} onTouchEnd={stop} />
    </div>
  );
}
