'use client';
import { useRef, useState } from 'react';

export default function PhotoShare({ caption = '이야기 미션 투어', shareOnly = false }) {
  const inputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  function pick(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setPhoto(reader.result); reader.readAsDataURL(file);
  }
  async function share() {
    try {
      if (photo && navigator.canShare) {
        const blob = await (await fetch(photo)).blob();
        const file = new File([blob], 'mission.png', { type: blob.type });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: caption }); return; }
      }
      if (navigator.share) { await navigator.share({ text: caption, url: window.location.origin }); return; }
      if (photo) { const a = document.createElement('a'); a.href = photo; a.download = 'mission.png'; a.click(); }
      else alert('공유를 지원하지 않는 브라우저예요.');
    } catch {}
  }
  return (
    <div className="card stack center">
      {!shareOnly && (<>
        <div className="eyebrow">인증샷</div>
        {photo && <img src={photo} alt="" style={{ width: '100%', borderRadius: 10 }} />}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={pick} hidden />
        <button className="btn ghost" onClick={() => inputRef.current?.click()}>{photo ? '다시 촬영' : '사진 촬영'}</button>
      </>)}
      <button className="btn" onClick={share}>공유하기</button>
    </div>
  );
}
