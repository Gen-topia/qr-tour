'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

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
      for (const q of qs) map[q.id] = await QRCode.toDataURL(`${window.location.origin}/q/${q.code}`, { width: 480, margin: 2 });
      setImgs(map);
    })();
  }, []);
  function download(q) { const a = document.createElement('a'); a.href = imgs[q.id]; a.download = `QR_${q.order_no}_${q.code}.png`; a.click(); }
  return (
    <div>
      <h1>QR 코드</h1>
      <p className="muted">각 QR을 인쇄해 현장 지점에 부착하세요. 스캔하면 해당 미션 페이지가 열립니다.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
        {quests.map(q => (
          <div key={q.id} className="card qr-card">
            {imgs[q.id] ? <img src={imgs[q.id]} alt={q.code} /> : <div style={{ width: 160, height: 160 }} />}
            <div style={{ fontWeight: 700 }}>미션 {q.order_no} · {q.title}</div>
            <div className="muted" style={{ fontSize: 12 }}>{origin}/q/{q.code}</div>
            <button className="btn sm" onClick={() => download(q)}>PNG 다운로드</button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function Page() { return <AdminShell><QrCodes /></AdminShell>; }
