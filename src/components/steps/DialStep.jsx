'use client';
import { useRef, useState } from 'react';

// 다이얼 돌리기 — 동심원 중 활성 링만 잡아서 돌린다.
// 핸들(●)을 목표 표시(◆)에 겹치도록 돌린 뒤 손을 떼면 성공.
export default function DialStep({ step, submit }) {
  const cfg = step.config || {};
  const rings = Math.max(1, Number(cfg.rings ?? 3));
  const activeRing = Math.min(rings - 1, Math.max(0, Number(cfg.active_ring ?? 1)));
  const target = ((Number(cfg.target_angle ?? 120) % 360) + 360) % 360;
  const tol = Number(cfg.tolerance ?? 12);

  const wrapRef = useRef(null);
  const lastRef = useRef(null);     // 직전 손가락 각도
  const doneRef = useRef(false);
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [missed, setMissed] = useState(false);

  // 두 각도의 최소 차이(0~180) — 서버 판정과 같은 식
  const diff = Math.abs(((angle - target + 540) % 360) - 180);
  const near = diff <= tol;

  // 링 지름(%)은 바깥에서 안쪽으로 줄어든다
  const ringSize = (i) => 100 - i * (46 / rings);
  const activePct = ringSize(activeRing) / 100;   // 활성 링 지름 비율

  const pointFrom = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    return {
      // 12시를 0°로 두어 핸들·목표 표시와 같은 좌표계를 쓴다
      angle: (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360,
      dist: Math.hypot(dx, dy) / (rect.width / 2),   // 반지름 대비 거리(0~1)
    };
  };

  function onDown(e) {
    if (doneRef.current) return;
    const { angle: a, dist } = pointFrom(e);
    // 활성 링 둘레 근처를 잡았을 때만 회전시킨다(다른 링은 반응하지 않음)
    if (Math.abs(dist - activePct) > 0.18) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);   // 손가락이 벗어나도 계속 추적
    lastRef.current = a;
    setDragging(true); setMissed(false);
  }

  function onMove(e) {
    if (!dragging || doneRef.current) return;
    const { angle: a } = pointFrom(e);
    if (lastRef.current !== null) {
      // 움직인 만큼만 더해 0°/360° 경계에서 튀지 않게 한다
      let d = a - lastRef.current;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      setAngle(prev => (prev + d + 360) % 360);
    }
    lastRef.current = a;
  }

  function onUp(e) {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false); lastRef.current = null;
    if (doneRef.current) return;
    if (near) { doneRef.current = true; submit({ angle }); }
    else setMissed(true);
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 다이얼</div>
      <p className="muted" style={{ margin: 0 }}>
        원의 <b>●</b>를 잡고 돌려 <b>◆</b> 위치에 맞춘 뒤 손을 떼세요.
      </p>
      <div ref={wrapRef} className="dial"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {Array.from({ length: rings }, (_, i) => {
          const isActive = i === activeRing;
          return (
            <div key={i}
              className={'dial__ring' + (isActive ? ' dial__ring--active' : '')
                + (isActive && near ? ' dial__ring--near' : '')}
              style={{
                width: `${ringSize(i)}%`, height: `${ringSize(i)}%`,
                transform: isActive
                  ? `translate(-50%,-50%) rotate(${angle}deg)`
                  : 'translate(-50%,-50%)',
              }}>
              {isActive && <span className="dial__handle" />}
            </div>
          );
        })}
        {/* 목표 표시 — 핸들과 같은 크기·좌표계라 겹치면 정답 */}
        <div className="dial__goal"
          style={{ width: `${ringSize(activeRing)}%`, height: `${ringSize(activeRing)}%`,
                   transform: `translate(-50%,-50%) rotate(${target}deg)` }}>
          <span className={'dial__goal-mark' + (near ? ' dial__goal-mark--near' : '')} />
        </div>
      </div>
      <p className="center" style={{ margin: 0, fontSize: 13, minHeight: 20 }}>
        {doneRef.current
          ? <b style={{ color: 'var(--lantern)' }}>맞췄어요!</b>
          : near
            ? <b style={{ color: 'var(--iris-2)' }}>여기예요 — 손을 떼세요</b>
            : missed
              ? <span style={{ color: 'var(--talisman)' }}>조금 더 정확히 맞춰주세요</span>
              : <span className="muted">{Math.round(diff)}° 남음</span>}
      </p>
    </div>
  );
}
