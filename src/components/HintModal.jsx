'use client';
import { useState } from 'react';

export default function HintModal({ hint }) {
  const [open, setOpen] = useState(false);
  if (!hint) return null;
  return (
    <>
      <button className="btn ghost" onClick={() => setOpen(true)}>힌트 보기</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,26,46,.35)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 50 }}>
          <div className="card stack" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div className="eyebrow">힌트</div>
            <p style={{ margin: 0 }}>{hint}</p>
            <button className="btn" onClick={() => setOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
}
