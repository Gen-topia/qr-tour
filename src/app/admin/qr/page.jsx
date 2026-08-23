'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

// 미션 16의 QR만 미션 페이지가 아니라 첫 화면으로 보낸다. 나머지는 지금 보고 있는 주소 기준.
const SITE_16 = 'https://qr-tour-neon.vercel.app/';
const urlOf = (q, origin) => (q.order_no === 16 ? SITE_16 : `${origin}/q/${q.code}`);

function QrCodes() {
  const [quests, setQuests] = useState([]);
  const [imgs, setImgs] = useState({});
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      const QRCode = (await import('qrcode')).default;
      const qs = (await api.adminQuests()).quests; setQuests(qs);
      const map = {};
      for (const q of qs) map[q.id] = await QRCode.toDataURL(urlOf(q, window.location.origin), { width: 480, margin: 2 });
      setImgs(map);
    })();
  }, []);
  function download(q) { const a = document.createElement('a'); a.href = imgs[q.id]; a.download = `QR_${q.order_no}_${q.code}.png`; a.click(); }
  return (
    <div>
      <h1>QR 코드</h1>
      <p className="muted">각 QR을 인쇄해 현장 지점에 부착하세요. 스캔하면 해당 미션 페이지가 열립니다.</p>
      <div className="qr-grid">
        {quests.map(q => (
          <div key={q.id} className="card qr-card">
            {imgs[q.id]
              ? <img src={imgs[q.id]} alt={q.code} />
              : <div className="qr-card__ph" />}
            <div className="qr-card__title">미션 {q.order_no} · {q.order_no === 16 ? '홈페이지로 연결' : q.title}</div>
            <div className="muted qr-card__url">{urlOf(q, origin)}</div>
            <button className="btn sm" onClick={() => download(q)}>PNG 다운로드</button>
          </div>
        ))}
        {quests.length === 0 && <p className="muted">등록된 미션이 없습니다.</p>}
      </div>
    </div>
  );
}
export default function Page() { return <AdminShell><QrCodes /></AdminShell>; }
