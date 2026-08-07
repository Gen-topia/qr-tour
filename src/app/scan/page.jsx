'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';

// html5-qrcode의 stop()은 실행 중이 아니면 Promise가 아니라 문자열을 동기적으로 throw한다.
// (권한 거부로 start가 실패한 뒤 정리할 때가 그렇다) → 동기·비동기 예외를 모두 삼킨다.
function stopScanner(scanner) {
  if (!scanner) return;
  const clear = () => { try { scanner.clear(); } catch {} };
  try {
    const p = scanner.stop();
    if (p && typeof p.then === 'function') p.then(clear).catch(clear);
    else clear();
  } catch { clear(); }
}

function Scan() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [camReady, setCamReady] = useState(false);
  const [attempt, setAttempt] = useState(0);   // 값이 바뀌면 카메라 권한을 다시 요청한다

  useEffect(() => {
    let scanner, alive = true, done = false;
    setErr(''); setCamReady(false);
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode'); // SSR 회피 + 지연 로딩
      if (!alive) return;
      scanner = new Html5Qrcode('qr-reader');
      try {
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (done) return; done = true;
            stopScanner(scanner);
            const m = String(decoded).match(/\/q\/([^/?#]+)/);
            router.replace(`/q/${encodeURIComponent(m ? m[1] : decoded)}`);
          }, () => {}
        );
        if (alive) setCamReady(true);
      } catch (e) {
        // 브라우저가 '차단'을 기억한 경우 팝업이 다시 뜨지 않으므로 복구 방법을 안내한다
        const denied = /NotAllowedError|Permission|denied/i.test(String(e?.name || '') + String(e?.message || e));
        if (alive) setErr(denied ? 'blocked' : 'failed');
      }
    })();
    // 화면을 떠날 때 카메라를 완전히 정리해야 다시 들어왔을 때 새로 요청된다
    return () => {
      alive = false;
      stopScanner(scanner);
    };
  }, [router, attempt]);

  return (
    <div className="screen">
      <div className="eyebrow">QR 스캔</div>
      <h1>지점의 QR을 비춰주세요</h1>
      {/* 카메라가 열리기 전에도 같은 크기의 자리를 잡아둬 화면이 밀리지 않게 한다 */}
      <div className="scan-box">
        <div id="qr-reader" style={{ width: '100%' }} />
        {!camReady && (
          err
            ? <button type="button" className="scan-box__msg scan-box__msg--err"
                onClick={() => setAttempt(a => a + 1)}>
                {err === 'blocked' ? (<>
                  카메라 권한을 허용해주세요.
                  <span className="scan-box__hint">
                    주소창의 자물쇠(iPhone은 ᴀA)를 눌러<br />카메라를 허용한 뒤 여기를 눌러주세요.
                  </span>
                </>) : (<>
                  카메라를 열 수 없습니다.
                  <span className="scan-box__hint">여기를 눌러 다시 시도해 주세요.</span>
                </>)}
              </button>
            : <p className="muted scan-box__msg">카메라를 준비하는 중…</p>
        )}
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>스마트폰 카메라로 스캔해도 바로 열려요.</p>
      <div className="grow" />
      <button className="btn ghost" onClick={() => router.replace('/')}>메인으로</button>
    </div>
  );
}
export default function Page() { return <Protected><Scan /></Protected>; }
