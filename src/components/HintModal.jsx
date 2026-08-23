'use client';
import { useState } from 'react';

// 스텝에 적어둔 힌트(글·그림)를 모달로 보여준다.
// 힌트 그림은 크게 띄우고, 누르면 화면을 꽉 채워 본다.
export default function HintModal({ hint, image, className = 'btn ghost' }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  if (!hint && !image) return null;

  const close = () => { setZoom(false); setOpen(false); };
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>힌트 보기</button>
      {open && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(20,26,46,.35)', display: 'grid', placeItems: 'center', padding: 12, zIndex: 50 }}>
          <div className="card stack" style={{ maxWidth: image ? 'min(94vw, 520px)' : 340, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="eyebrow">힌트</div>
            {image && (
              <img className={`hint__img${zoom ? ' is-zoom' : ''}`} src={image} alt="힌트 그림"
                   onClick={() => setZoom(z => !z)} />
            )}
            {hint && <p style={{ margin: 0 }}>{hint}</p>}
            <button className="btn" onClick={close}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
}
