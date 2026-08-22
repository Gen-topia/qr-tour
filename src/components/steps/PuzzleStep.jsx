'use client';
import { useEffect, useRef, useState } from 'react';

// 4조각 퍼즐 — 흩어진 조각을 끌어다 제자리에 맞춘다.
// 좌표는 놀이판 기준 퍼센트라 화면 크기가 달라져도 그대로 들어맞는다.
// (Pointer Event 하나로 마우스·터치·펜을 함께 처리한다)
const SIZE = 30;                 // 조각 한 변(%)
const MAX = 100 - SIZE;          // 조각 좌상단이 갈 수 있는 최대 좌표
const SNAP = 9;                  // 제자리로 붙는 거리(%)

// 완성 그림은 놀이판 가운데 60% 사각형 — 조각 순서는 좌상·우상·좌하·우하
const HOME = [{ x: 20, y: 20 }, { x: 50, y: 20 }, { x: 20, y: 50 }, { x: 50, y: 50 }];

// 가장자리에 흩뿌릴 자리들. 제자리와 겹치지 않는 좌표만 골라 뒀다.
const SCATTER = [
  { x: 0, y: 0 }, { x: MAX, y: 0 }, { x: 0, y: MAX }, { x: MAX, y: MAX },
  { x: 35, y: 0 }, { x: 0, y: 35 }, { x: MAX, y: 35 }, { x: 35, y: MAX },
];

const scattered = () => {
  const spots = [...SCATTER];
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }
  return spots.slice(0, 4);
};

const clamp = (v) => Math.min(MAX, Math.max(0, v));

export default function PuzzleStep({ step, submit }) {
  const pieces = step.config?.pieces || [];
  const doneImage = step.config?.done_image_url;   // 다 맞췄을 때 얹을 완성 그림
  const [doneBroken, setDoneBroken] = useState(false);
  const [pos, setPos] = useState(scattered);
  const [placed, setPlaced] = useState([false, false, false, false]);
  const [dragging, setDragging] = useState(null);
  const areaRef = useRef(null);
  const dragRef = useRef(null);
  const posRef = useRef(pos);        // 드래그 중 최신 좌표를 stale closure 없이 읽는다
  const doneRef = useRef(false);

  const move = (i, p) => {
    posRef.current = posRef.current.map((q, k) => (k === i ? p : q));
    setPos(posRef.current);
  };

  const solved = placed.every(Boolean);
  const showDone = solved && doneImage && !doneBroken;
  useEffect(() => {
    if (!solved || doneRef.current) return;
    doneRef.current = true;
    submit({ done: true });
  }, [solved, submit]);

  function onDown(e, i) {
    if (placed[i]) return;
    const rect = areaRef.current.getBoundingClientRect();
    const p = posRef.current[i];
    dragRef.current = {
      i, rect,
      dx: e.clientX - (rect.left + rect.width * p.x / 100),
      dy: e.clientY - (rect.top + rect.height * p.y / 100),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(i);
  }

  function onMove(e) {
    const d = dragRef.current;
    if (!d) return;
    move(d.i, {
      x: clamp((e.clientX - d.dx - d.rect.left) / d.rect.width * 100),
      y: clamp((e.clientY - d.dy - d.rect.top) / d.rect.height * 100),
    });
  }

  function onUp() {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDragging(null);
    const p = posRef.current[d.i];
    const home = HOME[d.i];
    if (Math.hypot(p.x - home.x, p.y - home.y) <= SNAP) {
      move(d.i, home);
      setPlaced(pl => pl.map((v, k) => (k === d.i ? true : v)));
    }
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 퍼즐</div>
      <p className="muted" style={{ margin: 0 }}>흩어진 조각을 끌어다 가운데에서 그림을 맞춰주세요.</p>
      <div className={`jig${showDone ? ' jig--done' : ''}`} ref={areaRef}>
        {!showDone && <div className="jig__guide" />}
        {/* 완성 그림을 얹은 뒤에는 조각을 걷어낸다 */}
        {!showDone && pos.map((p, i) => (
          <div key={i}
            className={'jig__piece'
              + (dragging === i ? ' jig__piece--drag' : '')
              + (placed[i] ? ' jig__piece--set' : '')}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onPointerDown={e => onDown(e, i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}>
            {pieces[i]
              ? <img src={pieces[i]} alt="" draggable="false" />
              : <span className="jig__num">{i + 1}</span>}
          </div>
        ))}
        {/* 다 맞추면 조각 경계 없이 완성 그림을 얹는다.
            그림을 못 불러오면 맞춘 조각이 그대로 남는다 */}
        {showDone && (
          <img className="jig__done" src={doneImage} alt="" onError={() => setDoneBroken(true)} />
        )}
      </div>
      {solved && <p className="center" style={{ color: 'var(--lantern)', margin: 0, fontWeight: 700 }}>완성했어요!</p>}
    </div>
  );
}
