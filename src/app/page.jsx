'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authClient';
import Loading from '@/components/Loading';

function MainInner() {
  const { isAuthed, ready, user, loginAsTest, reset } = useAuth();
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const err = params.get('error');

  if (!ready) return <Loading />;

  if (!isAuthed) {
    const startUrl = (provider) => `/api/auth/${provider}/start?next=${encodeURIComponent(next)}`;
    const onTest = async () => {
      setTesting(true);
      try { await loginAsTest(); router.replace(next); }
      catch (e) { alert(e.message); setTesting(false); }
    };
    return (
      <div className="screen fade-in">
        <div className="grow" /><div className="lantern" />
        <div className="eyebrow center">제주 미션 투어</div>
        <h1 className="center">측간신의 부탁</h1>
        <p className="muted center">간편 로그인으로 시작하세요.<br/>진행 기록은 계정에 저장돼요.</p>
        {err && <p className="center" style={{ color: 'var(--talisman)', fontSize: 14 }}>{err}</p>}
        <div className="grow" />
        <div className="stack">
          <a className="btn btn--kakao" href={startUrl('kakao')}>카카오로 시작하기</a>
          <a className="btn btn--naver" href={startUrl('naver')}>네이버로 시작하기</a>
          <button className="btn ghost" onClick={onTest} disabled={testing}>
            {testing ? '로그인 중…' : '테스트로 시작하기'}
          </button>
        </div>
      </div>
    );
  }

  // 저장된 계정 정보를 지우고 로그인 화면으로(next 쿼리도 제거)
  const onLogout = () => { reset(); router.replace('/'); };

  return (
    <div className="screen fade-in">
      <div className="topbar">
        <button type="button" onClick={onLogout}>로그아웃</button>
      </div>
      <div className="grow" /><div className="lantern" />
      <div className="eyebrow center">이야기 미션 투어</div>
      <h1 className="center">{user?.nickname ? `${user.nickname} 님` : '어서 오세요'}</h1>
      <p className="muted center">지점의 QR을 스캔해 미션을 이어가세요.</p>
      <div className="grow" />
      <div className="stack">
        <Link className="btn" href="/scan">QR 스캔하기</Link>
        <Link className="btn ghost" href="/missions">나의 미션 확인</Link>
      </div>
    </div>
  );
}

export default function MainPage() {
  return <Suspense fallback={<Loading />}><MainInner /></Suspense>;
}
