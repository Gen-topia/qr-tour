'use client';
import { useRef, useState } from 'react';

// 다이얼 돌리기 — 동심원 중 활성 링만 터치를 받는다.
// 손가락 각도를 따라 링이 회전하고, 목표 각도 ±tolerance에 들어오면 성공.
export default function DialStep({ step, submit }) {
  const cfg = step.config || {};
  const rings = Math.max(1, Number(cfg.rings ?? 3));
  const activeRing = Math.min(rings - 1, Math.max(0, Number(cfg.active_ring ?? 1)));
  const target = Number(cfg.target_angle ?? 120);
  const tol = Number(cfg.tolerance ?? 12);

  const wrapRef = useRef(null);
  const draggingRef = useRef(false);
  const lastRef = useRef(null);     // 직전 손가락 각도
  const doneRef = useRef(false);
  const [angle, setAngle] = useState(0);

  // 0~180으로 정규화한 목표와의 차이
  const diff = Math.abs(((angle - target) % 360 + 540) % 360 - 180);
  const near = 180 - diff <= tol;

  const pointAngle = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    return Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI;
  };

  function move(e) {
    if (!draggingRef.current || doneRef.current) return;
    const cur = pointAngle(e);
    if (lastRef.current !== null) {
      // 손가락이 움직인 만큼만 더해 -180/180 경계에서 튀지 않게 한다
      let d = cur - lastRef.current;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      setAngle(a => (a + d + 360) % 360);
    }
    lastRef.current = cur;
  }

  const start = (e) => { draggingRef.current = true; lastRef.current = pointAngle(e); };
  function end() {
    draggingRef.current = false; lastRef.current = null;
    if (!doneRef.current && near) { doneRef.current = true; submit({ angle }); }
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 다이얼</div>
      <p className="muted" style={{ margin: 0 }}>가운데 링을 돌려 표시에 맞춰주세요.</p>
      <div ref={wrapRef} className="dial">
        {Array.from({ length: rings }, (_, i) => {
          const size = 100 - i * (46 / rings);
          const isActive = i === activeRing;
          return (
            <div key={i}
              className={'dial__ring' + (isActive ? ' dial__ring--active' : '') + (isActive && near ? ' dial__ring--near' : '')}
              style={{
                width: `${size}%`, height: `${size}%`,
                transform: isActive ? `translate(-50%,-50%) rotate(${angle}deg)` : 'translate(-50%,-50%)',
              }}
              onMouseDown={isActive ? start : undefined} onMouseMove={isActive ? move : undefined}
              onMouseUp={isActive ? end : undefined} onMouseLeave={isActive ? end : undefined}
              onTouchStart={isActive ? start : undefined} onTouchMove={isActive ? move : undefined}
              onTouchEnd={isActive ? end : undefined}>
              {isActive && <span className="dial__handle" />}
            </div>
          );
        })}
        {/* 목표 각도 표시 */}
        <span className="dial__target" style={{ transform: `translate(-50%,-50%) rotate(${target}deg)` }} />
      </div>
      <p className="muted center" style={{ margin: 0, fontSize: 12 }}>
        {doneRef.current ? '맞췄어요!' : near ? '거의 다 왔어요 — 손을 떼세요' : `${Math.round(angle)}°`}
      </p>
    </div>
  );
}
