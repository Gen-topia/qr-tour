'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authClient';

function MainInner() {
  const { isAuthed, ready, user } = useAuth();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const err = params.get('error');

  if (!ready) return <div className="screen center"><div className="lantern" /></div>;

  if (!isAuthed) {
    const startUrl = (provider) => `/api/auth/${provider}/start?next=${encodeURIComponent(next)}`;
    return (
      <div className="screen">
        <div className="grow" /><div className="lantern" />
        <div className="eyebrow center">제주 미션 투어</div>
        <h1 className="center">측간신의 부탁</h1>
        <p className="muted center">간편 로그인으로 시작하세요.<br/>진행 기록은 계정에 저장돼요.</p>
        {err && <p className="center" style={{ color: 'var(--talisman)', fontSize: 14 }}>{err}</p>}
        <div className="grow" />
        <div className="stack">
          <a className="btn btn--kakao" href={startUrl('kakao')}>카카오로 시작하기</a>
          <a className="btn btn--naver" href={startUrl('naver')}>네이버로 시작하기</a>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
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
  return <Suspense fallback={<div className="screen center"><div className="lantern" /></div>}><MainInner /></Suspense>;
}
