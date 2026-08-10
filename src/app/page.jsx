'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authClient';
import Loading from '@/components/Loading';
import Prologue from '@/components/Prologue';
import Guide from '@/components/Guide';

// 4. HOME 메뉴 — view는 전체화면으로 열고, to는 페이지로 이동한다
const MENU = [
  { label: '프롤로그 영상',      view: 'prologue' },
  { label: '수호자 지침서',      view: 'guide' },
  { label: '나의 퀘스트 보기',   to: '/missions' },
  { label: '파수꾼 코드 지도',   to: '/map' },
  { label: '파수꾼 코드 탐색',   to: '/scan' },
];

function MainInner() {
  const { isAuthed, ready, user, loginAsTest, reset } = useAuth();
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [view, setView] = useState(null);   // 'prologue' | 'guide' | null
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const err = params.get('error');

  if (!ready) return <Loading />;

  // 1-1. 인트로(수호자 서약 전)
  if (!isAuthed) {
    const startUrl = (provider) => `/api/auth/${provider}/start?next=${encodeURIComponent(next)}`;
    const onTest = async () => {
      setTesting(true);
      try { await loginAsTest(); router.replace(next); }
      catch (e) { alert(e.message); setTesting(false); }
    };
    return (
      <div className="login fade-in">
        <div className="stage">
          <div className="login__bg" />
          <div className="login__dim" />
          <div className="screen">
            <div className="grow" />
            <div className="eyebrow center">이야기 미션 투어</div>
            <h1 className="center">사라진 신들의 열쇠</h1>
            <p className="center login__sub">
              측간신의 어둠으로부터 오염된 현세의 유산을 정화하고 회복시켜<br />
              닫혀버린 하늘 문을 다시 열어낼 ‘수호자’가 되어주세요.
            </p>
            {err && <p className="center" style={{ color: 'var(--talisman)', fontSize: 14 }}>{err}</p>}
            <div className="grow" />
            <div className="stack">
              <a className="btn btn--kakao" href={startUrl('kakao')}>카카오로 수호자 서약</a>
              <a className="btn btn--naver" href={startUrl('naver')}>네이버로 수호자 서약</a>
              <button className="btn ghost" onClick={onTest} disabled={testing}>
                {testing ? '서약 중…' : '테스트로 시작하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. 프롤로그 영상 → 끝나면 6. 수호자 지침서로 이어진다
  if (view === 'prologue') return <Prologue onEnd={() => setView('guide')} onClose={() => setView(null)} />;
  if (view === 'guide') return <Guide onDone={() => setView(null)} />;

  // 저장된 계정 정보를 지우고 로그인 화면으로(next 쿼리도 제거)
  const onLogout = () => { reset(); router.replace('/'); };

  return (
    <div className="home fade-in">
      <div className="stage">
        <div className="home__bg" />
        <div className="home__dim" />
        <div className="screen">
          <div className="topbar">
            <button type="button" onClick={onLogout}>로그아웃</button>
          </div>
          <div className="grow" />
          <div className="eyebrow center">이야기 미션 투어</div>
          <h1 className="center">사라진 신들의 열쇠</h1>
          <p className="muted center">{user?.nickname ? `${user.nickname} 수호자님, 어서 오세요.` : '수호자님, 어서 오세요.'}</p>
          <nav className="menu">
            {MENU.map(m => (
              m.to
                ? <Link key={m.label} href={m.to} className="btn glass menu__item">{m.label}</Link>
                : <button key={m.label} type="button" className="btn glass menu__item"
                    onClick={() => setView(m.view)}>{m.label}</button>
            ))}
          </nav>
          <div className="grow" />
        </div>
      </div>
    </div>
  );
}

export default function MainPage() {
  return <Suspense fallback={<Loading />}><MainInner /></Suspense>;
}
