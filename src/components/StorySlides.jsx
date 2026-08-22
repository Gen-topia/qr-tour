'use client';
import { useState } from 'react';

// 긴 이야기를 좌우로 넘겨 읽는 장 — 관리툴 config의 { "slides": ["...", "..."] }
// 밀거나, 양옆 화살표를 누르거나, 글을 툭 눌러도 넘어간다.
export default function StorySlides({ items, at, onMove }) {
  const [from, setFrom] = useState(null);   // 넘기려고 누른 자리
  const go = (d) => onMove(Math.min(items.length - 1, Math.max(0, at + d)));

  const onUp = (e) => {
    if (from === null) return;
    const dx = e.clientX - from;
    setFrom(null);
    if (dx < -40) go(1);
    else if (dx > 40) go(-1);
    else go(1);
  };

  return (
    <div className="sld"
         onPointerDown={e => setFrom(e.clientX)}
         onPointerUp={onUp}
         onPointerCancel={() => setFrom(null)}>
      <button type="button" className="sld__arrow" disabled={at === 0}
              onClick={e => { e.stopPropagation(); go(-1); }} aria-label="이전">‹</button>
      <p className="sld__text">{items[at]}</p>
      <button type="button" className="sld__arrow" disabled={at >= items.length - 1}
              onClick={e => { e.stopPropagation(); go(1); }} aria-label="다음">›</button>
      <div className="sld__dots" aria-hidden="true">
        {items.map((_, k) => <i key={k} className={k === at ? 'is-on' : ''} />)}
      </div>
    </div>
  );
}
