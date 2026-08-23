'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authClient';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';
import Prologue from '@/components/Prologue';
import Guide from '@/components/Guide';
import PreQuest from '@/components/PreQuest';
import Oath from '@/components/Oath';
import Onboarding from '@/components/Onboarding';
import InfoModal from '@/components/InfoModal';
import TestJump from '@/components/TestJump';

// 4. HOME 메뉴 — view는 전체화면으로 열고, to는 페이지로 이동한다
const MENU = [
  { label: '프롤로그 영상',      view: 'prologue' },
  { label: '수호자 지침서',      view: 'guide' },
  { label: '나의 퀘스트 보기',   to: '/missions' },
  { label: '파수꾼 코드 지도',   to: '/map' },
  { label: '파수꾼 코드 탐색',   to: '/scan' },
];

// 사전 퀘스트 안내는 계정마다 한 번만 띄운다
const PREQ_KEY = (uuid) => `preq_seen:${uuid || 'guest'}`;

function MainInner() {
  const { isAuthed, ready, user, uuid, reset } = useAuth();
  const router = useRouter();
  const [view, setView] = useState(null);   // 'prologue' | 'guide' | null
  const [preq, setPreq] = useState(false);  // 사전 퀘스트 안내 표시 여부
  const [oath, setOath] = useState(null);   // 서약을 받는 중인 로그인 수단
  const [jump, setJump] = useState(false);  // 테스트용 퀘스트 바로가기 패널
  const [oathView, setOathView] = useState(false); // 테스트용 수호자 서약 다시 보기
  const [onboard, setOnboard] = useState(false); // 로그인 직후 순서 안내
  const [closed, setClosed] = useState(false);   // 오픈 전이라 로그인을 받지 않는 상태
  const [allDone, setAllDone] = useState(false); // 퀘스트3까지 모두 완수해 여정이 끝난 상태
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const err = params.get('error');
  const signup = params.get('signup') === '1';   // 방금 가입한 수호자

  // 로그인 후 첫 방문이면 안내를 띄운다.
  // 프롤로그 → 지침서 → 사전 퀘스트 순서로 이어지고, 지침서를 닫는 순간 사전 퀘스트가 온다.
  // (SSR에서 localStorage 금지)
  useEffect(() => {
    if (!ready || !isAuthed) return;
    if (localStorage.getItem(PREQ_KEY(uuid))) return;
    const t = setTimeout(() => setOnboard(true), 500);
    return () => clearTimeout(t);
  }, [ready, isAuthed, uuid, signup]);

  // 퀘스트3을 모두 완수했으면 메인에서 다시 시도할 수 없게 막는다
  useEffect(() => {
    if (!ready || !isAuthed) return;
    api.myMissions()
      .then(d => {
        const last = d.quests.filter(q => q.quest_group === 3);
        setAllDone(last.length > 0 && last.every(q => q.cleared));
      })
      .catch(() => {});
  }, [ready, isAuthed]);

  // 지침서를 덮으면 순서의 마지막인 사전 퀘스트가 도착한다
  const onGuideDone = () => {
    setView(null);
    if (!localStorage.getItem(PREQ_KEY(uuid))) setPreq(true);
  };

  // 테스트용 — Ctrl+1로 퀘스트 바로가기 패널을 연다.
  // 키 배열에 따라 key가 달라질 수 있어 code(Digit1)도 함께 보고,
  // 다른 핸들러보다 먼저 받도록 잡아채는 단계(capture)에서 처리한다.
  useEffect(() => {
    if (!ready || !isAuthed) return;
    const onKey = (e) => {
      if (!e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key !== '1' && e.code !== 'Digit1') return;
      e.preventDefault();
      e.stopPropagation();
      setView(null);      // 프롤로그·지침서를 보는 중이어도 바로 열리게
      setJump(true);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [ready, isAuthed]);

  // 테스트용 — 메인 화면에서 스페이스바를 누르면 사전 퀘스트를 다시 띄운다
  useEffect(() => {
    if (!ready || !isAuthed || view) return;
    const onKey = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();   // 버튼에 포커스가 있어도 눌리지 않게
      setPreq(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, isAuthed, view]);

  const closePreq = () => {
    localStorage.setItem(PREQ_KEY(uuid), '1');
    setPreq(false);
  };

  if (!ready) return <Loading />;

  // 1-1. 인트로(수호자 서약 전)
  if (!isAuthed) {
    const startUrl = (provider) => `/api/auth/${provider}/start?next=${encodeURIComponent(next)}`;
    const go = (provider) => { window.location.href = startUrl(provider); };
    // 서약은 최초 1회만 받는다. 이미 했다면 곧바로 소셜 로그인으로 넘어간다.
    // 로그인 버튼을 눌렀을 때 오픈 여부를 확인한다.
    // 닫혀 있으면 안내만 하고 아무 것도 진행하지 않는다.
    const ask = async (provider) => {
      try {
        const r = await api.settings();
        if (!r.questOpen) { setClosed(true); return; }
      } catch { /* 확인에 실패하면 막지 않는다 */ }
      setOath(provider);
    };
    if (oath) return (
      <Oath onBack={() => setOath(null)} onAgree={() => go(oath)} />
    );

    return (
      <div className="login fade-in">
        <div className="stage">
          <div className="login__bg" />
          <div className="screen">
            <div className="grow" />
            <p className="center login__sub">
              {/* 측간신의 어둠으로부터 오염된 현세의 유산을 정화하고 회복시켜<br />
              닫혀버린 하늘 문을 다시 열어낼 ‘수호자’가 되어주세요. */}
            </p>
            {err && <p className="center" style={{ color: 'var(--talisman)', fontSize: 14 }}>{err}</p>}
            <div className="grow" />
            <div className="stack">
              <button type="button" className="btn btn--oauth menu__item" onClick={() => ask('naver')}>
                <svg className="btn__logo" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M13.5615 10.6919 6.16846 0H0v20h6.43848V9.30664L13.8315 20H20V0h-6.4385v10.6919Z" />
                </svg>
                네이버로 수호자 서약
              </button>
              <button type="button" className="btn btn--oauth menu__item" onClick={() => ask('kakao')}>
                <svg className="btn__logo" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3C6.477 3 2 6.463 2 10.75c0 2.708 1.79 5.09 4.5 6.47-.2.73-.72 2.63-.82 3.04-.13.5.18.5.39.36.16-.11 2.6-1.77 3.66-2.49.74.11 1.5.17 2.27.17 5.523 0 10-3.463 10-7.55C22 6.463 17.523 3 12 3Z" />
                </svg>
                카카오로 수호자 서약
              </button>
            </div>
          </div>
        </div>
        {/* 오픈 전이라 로그인을 받지 않을 때 — 확인하면 닫히기만 한다 */}
        {closed && (
          <InfoModal eyebrow="안내" title="이용할 수 있는 기간이 아닙니다"
                     confirmLabel="확인" onClose={() => setClosed(false)}>
            지금은 퀘스트를 진행할 수 있는 기간이 아니에요.{'\n'}운영 기간에 다시 찾아와 주세요.
          </InfoModal>
        )}
      </div>
    );
  }

  // 5. 프롤로그 영상 → 6. 수호자 지침서로 이어진다.
  // 끝까지 보든 중간에 닫든 지침서는 거쳐야 한다.
  if (view === 'prologue') return (
    <Prologue audioSrc="/prologue/prologue.mp3"
              onEnd={() => setView('guide')} onClose={() => setView('guide')} />
  );
  if (view === 'guide') return <Guide onDone={onGuideDone} />;

  // 테스트용 — Ctrl+1 패널에서 연 수호자 서약. 이미 로그인한 뒤라 읽고 덮기만 한다.
  if (oathView) return (
    <Oath onBack={() => setOathView(false)} onAgree={() => setOathView(false)} />
  );

  // 저장된 계정 정보를 지우고 로그인 화면으로(next 쿼리도 제거)
  const onLogout = () => { reset(); router.replace('/'); };

  return (
    <div className="home fade-in">
      <div className="stage">
        <div className="home__bg" />
        <div className="screen">
          <div className="grow" />
          {/* <p className="muted center">{user?.nickname ? `${user.nickname} 수호자님, 어서 오세요.` : '수호자님, 어서 오세요.'}</p> */}
          <nav className="menu">
            {MENU.map(m => (
              m.to
                ? <Link key={m.label} href={m.to} className="btn btn--oauth menu__item">{m.label}</Link>
                : <button key={m.label} type="button" className="btn btn--oauth menu__item"
                    onClick={() => setView(m.view)}>{m.label}</button>
            ))}
            <button type="button" className="btn btn--oauth menu__logout" onClick={onLogout}>로그아웃</button>
          </nav>
          <div className="grow" />
        </div>
        {/* 프롤로그·지침서를 보는 동안에는 소리가 겹치지 않게 띄우지 않는다 */}
        {onboard && !allDone && (
          <Onboarding
            onStart={() => { setOnboard(false); setView('prologue'); }}
            onClose={() => setOnboard(false)} />
        )}
        {preq && !allDone && <PreQuest onDone={closePreq} />}
        {/* 테스트용 — Ctrl+1로 연다 */}
        {jump && <TestJump onClose={() => setJump(false)} onOath={() => setOathView(true)} />}
        {/* 여정의 끝 — 닫을 수 없다. 여기서부터는 다시 도전할 수 없다 */}
        {allDone && (
          <InfoModal eyebrow="여정의 끝" title="모든 퀘스트를 완수했습니다">
            수호자님의 거룩한 여정이 모두 끝났습니다.{'\n'}
            수호 본부(향사당)로 돌아가 발걸음을 증명하고{'\n'}
            명예의 전당에 이름을 새겨 주세요.
          </InfoModal>
        )}
      </div>
    </div>
  );
}

export default function MainPage() {
  return <Suspense fallback={<Loading />}><MainInner /></Suspense>;
}
