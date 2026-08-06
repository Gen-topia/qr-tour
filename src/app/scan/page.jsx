'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';

function Scan() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; startedRef.current = true;
    let scanner, done = false;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode'); // SSR 회피 + 지연 로딩
      scanner = new Html5Qrcode('qr-reader');
      scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (done) return; done = true;
          scanner.stop().catch(() => {});
          const m = String(decoded).match(/\/q\/([^/?#]+)/);
          router.replace(`/q/${encodeURIComponent(m ? m[1] : decoded)}`);
        }, () => {}
      ).catch(() => setErr('카메라를 열 수 없습니다. 브라우저의 카메라 권한을 허용해 주세요.'));
    })();
    return () => { try { scanner && scanner.stop(); } catch {} };
  }, [router]);

  return (
    <div className="screen">
      <div className="eyebrow">QR 스캔</div>
      <h1>지점의 QR을 비춰주세요</h1>
      <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 12 }} />
      {err && <p style={{ color: 'var(--talisman)', marginTop: 12 }}>{err}</p>}
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>폰 기본 카메라로 스캔해도 바로 열려요.</p>
      <div className="grow" />
      <button className="btn ghost" onClick={() => router.replace('/')}>메인으로</button>
    </div>
  );
}
export default function Page() { return <Protected><Scan /></Protected>; }
