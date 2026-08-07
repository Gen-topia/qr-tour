'use client';
import { useEffect, useRef, useState } from 'react';

// 4조각 퍼즐 — 조각 두 개를 눌러 자리를 바꾼다. 원래 순서가 되면 성공.
// (모바일에서 드래그보다 탭-교환이 훨씬 안정적이다)
const shuffled = () => {
  // 처음부터 맞춰진 상태로 시작하지 않도록 섞는다
  const base = [0, 1, 2, 3];
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.every((v, i) => v === i) ? [1, 0, 3, 2] : base;
};

export default function PuzzleStep({ step, submit }) {
  const pieces = step.config?.pieces || [];
  const [order, setOrder] = useState(() => shuffled());
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const doneRef = useRef(false);

  const solved = order.every((v, i) => v === i);

  useEffect(() => {
    if (!solved || doneRef.current) return;
    doneRef.current = true;
    setBusy(true);
    submit({ done: true }).finally(() => setBusy(false));
  }, [solved, submit]);

  function tap(i) {
    if (solved || busy) return;
    if (picked === null) { setPicked(i); return; }
    if (picked === i) { setPicked(null); return; }
    setOrder(o => { const n = [...o]; [n[picked], n[i]] = [n[i], n[picked]]; return n; });
    setPicked(null);
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 퍼즐</div>
      <p className="muted" style={{ margin: 0 }}>조각을 두 번 눌러 자리를 바꿔 그림을 맞춰주세요.</p>
      <div className="puzzle">
        {order.map((pieceIdx, slot) => (
          <button key={slot} type="button"
            className={'puzzle__cell' + (picked === slot ? ' puzzle__cell--on' : '')}
            onClick={() => tap(slot)} disabled={solved}>
            {pieces[pieceIdx]
              ? <img src={pieces[pieceIdx]} alt="" />
              : <span className="puzzle__num">{pieceIdx + 1}</span>}
          </button>
        ))}
      </div>
      {solved && <p style={{ color: 'var(--lantern)', margin: 0, fontWeight: 700 }}>완성했어요!</p>}
    </div>
  );
}
