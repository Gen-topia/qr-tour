'use client';
import { useEffect, useRef, useState } from 'react';

// 걷어내기 — 배경 사진을 덮은 네 조각을 판 바깥으로 끌어내면 성공.
// 좌표는 놀이판 기준 퍼센트라 화면 크기가 달라져도 그대로 들어맞는다.
// (Pointer Event 하나로 마우스·터치·펜을 함께 처리한다)
const HOME = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: 50, y: 50 }];
const HALF = 25;   // 조각 절반(%) — 조각 한가운데가 판을 벗어났는지 볼 때 쓴다

export default function ClearStep({ step, submit }) {
  const pieces = step.config?.pieces || [];
  const background = step.config?.background_url;
  const [off, setOff] = useState(() => HOME.map(() => ({ x: 0, y: 0 })));  // 제자리에서 밀려난 거리(%)
  const [gone, setGone] = useState([false, false, false, false]);
  const [dragging, setDragging] = useState(null);
  const areaRef = useRef(null);
  const dragRef = useRef(null);
  const offRef = useRef(off);        // 드래그 중 최신 좌표를 stale closure 없이 읽는다
  const doneRef = useRef(false);

  const move = (i, p) => {
    offRef.current = offRef.current.map((q, k) => (k === i ? p : q));
    setOff(offRef.current);
  };

  const cleared = gone.every(Boolean);
  useEffect(() => {
    if (!cleared || doneRef.current) return;
    doneRef.current = true;
    submit({ done: true });
  }, [cleared, submit]);

  function onDown(e, i) {
    const rect = areaRef.current.getBoundingClientRect();
    dragRef.current = { i, rect, x: e.clientX, y: e.clientY, from: offRef.current[i] };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(i);
  }

  function onMove(e) {
    const d = dragRef.current;
    if (!d) return;
    move(d.i, {
      x: d.from.x + (e.clientX - d.x) / d.rect.width * 100,
      y: d.from.y + (e.clientY - d.y) / d.rect.height * 100,
    });
  }

  function onUp() {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDragging(null);
    const o = offRef.current[d.i];
    const cx = HOME[d.i].x + HALF + o.x;
    const cy = HOME[d.i].y + HALF + o.y;
    // 조각 한가운데가 판 밖으로 나가면 걷어낸 것으로 본다. 아니면 제자리로 돌아온다.
    if (cx < 0 || cx > 100 || cy < 0 || cy > 100) setGone(g => g.map((v, k) => (k === d.i ? true : v)));
    else move(d.i, { x: 0, y: 0 });
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 걷어내기</div>
      <p className="muted" style={{ margin: 0 }}>덮인 조각을 판 바깥으로 끌어내 주세요.</p>
      <div className="clr" ref={areaRef}>
        {background && <img className="clr__bg" src={background} alt="" />}
        {HOME.map((home, i) => gone[i] ? null : (
          <div key={i}
            className={'clr__piece' + (dragging === i ? ' clr__piece--drag' : '')}
            style={{ left: `${home.x + off[i].x}%`, top: `${home.y + off[i].y}%` }}
            onPointerDown={e => onDown(e, i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}>
            {pieces[i]
              ? <img src={pieces[i]} alt="" draggable="false" />
              : <span className="clr__num">{i + 1}</span>}
          </div>
        ))}
      </div>
      {cleared && <p className="center" style={{ color: 'var(--lantern)', margin: 0, fontWeight: 700 }}>다 걷어냈어요!</p>}
    </div>
  );
}
