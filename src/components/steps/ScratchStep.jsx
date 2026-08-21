'use client';
import { useRef, useState } from 'react';
import Scratch from '@/components/Scratch';

// 문지르기 — 캔버스 덮개를 손가락으로 지운다. 지워진 비율이 threshold를 넘으면 성공.
export default function ScratchStep({ step, submit }) {
  const cfg = step.config || {};
  const threshold = Number(cfg.threshold ?? 0.7);
  const doneRef = useRef(false);
  const [pct, setPct] = useState(0);
  const [revealBroken, setRevealBroken] = useState(false);   // 그림을 아직 안 넣었으면 자리표시로

  function onProgress(p) {
    if (doneRef.current) return;
    setPct(p);
    if (p >= threshold) { doneRef.current = true; submit({ done: true }); }
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 문지르기</div>
      <p className="muted" style={{ margin: 0 }}>손가락으로 문질러 가려진 그림을 드러내 주세요.</p>
      <Scratch cover={cfg.cover_color || '#c9cede'} coverImage={cfg.cover_image_url} onProgress={onProgress}>
        {cfg.reveal_image_url && !revealBroken
          ? <img className="scratch__under" src={cfg.reveal_image_url} alt=""
                 onError={() => setRevealBroken(true)} />
          : <div className="scratch__under scratch__under--ph">🎁</div>}
      </Scratch>
      <div className="gauge"><i style={{ width: `${Math.min(100, (pct / threshold) * 100)}%` }} /></div>
    </div>
  );
}
