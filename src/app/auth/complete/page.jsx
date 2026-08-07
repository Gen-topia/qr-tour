'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authClient';
import Loading from '@/components/Loading';

function CompleteInner() {
  const { completeSocialLogin } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [err, setErr] = useState('');
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;          // 쿠키는 1회용 — StrictMode 이중 실행 방지
    once.current = true;
    (async () => {
      try { await completeSocialLogin(); router.replace(next); }
      catch (e) { setErr(e.message); }
    })();
  }, [completeSocialLogin, next, router]);

  if (err) return (
    <div className="screen center">
      <div className="grow" />
      <p style={{ color: 'var(--talisman)' }}>{err}</p>
      <div className="grow" />
      <button className="btn" onClick={() => router.replace('/')}>처음으로</button>
    </div>
  );
  return <Loading label="로그인 중…" />;
}

export default function AuthCompletePage() {
  return <Suspense fallback={<Loading label="로그인 중…" />}><CompleteInner /></Suspense>;
}
