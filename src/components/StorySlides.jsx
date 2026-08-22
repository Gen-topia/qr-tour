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
    <div className="sld">
      <button type="button" className="sld__arrow" disabled={at === 0}
              onClick={() => go(-1)} aria-label="이전">‹</button>

      {/* 글이 실제로 옆으로 미끄러지도록 전부 이어 붙여 두고 통째로 민다 */}
      <div className="sld__view"
           onPointerDown={e => setFrom(e.clientX)}
           onPointerUp={onUp}
           onPointerCancel={() => setFrom(null)}>
        <div className="sld__track" style={{ transform: `translateX(-${at * 100}%)` }}>
          {items.map((t, k) => <p key={k} className="sld__text">{t}</p>)}
        </div>
      </div>

      <button type="button" className="sld__arrow" disabled={at >= items.length - 1}
              onClick={() => go(1)} aria-label="다음">›</button>

      <div className="sld__dots" aria-hidden="true">
        {items.map((_, k) => <i key={k} className={k === at ? 'is-on' : ''} />)}
      </div>
    </div>
  );
}
