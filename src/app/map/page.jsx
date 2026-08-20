'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import Loading from '@/components/Loading';
import SheetNav from '@/components/SheetNav';
import Sparkle from '@/components/Sparkle';
import { api } from '@/lib/apiClient';
import { SPOT_GROUPS } from '@/lib/spots';

function CodeMap() {
  const [quests, setQuests] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);   // 펼쳐 둔 장소 코드
  const router = useRouter();

  useEffect(() => { api.myMissions().then(d => setQuests(d.quests)).catch(e => setErr(e.message)); }, []);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!quests) return <Loading label="코드 지도를 불러오는 중…" />;

  // 장소에 연결된 미션이 모두 끝났으면 해결 표시
  const stateOf = (code) => {
    const mine = quests.filter(q => q.place === code);
    if (!mine.length) return null;
    return mine.every(q => q.cleared) ? '해결' : '미해결';
  };

  return (
    <div className="onboard sheet gd mq cm">
      <div className="sheet__panel">
        <header className="gd__hero">
          <div className="gd__toolbar">
            <button type="button" className="gd__back" onClick={() => router.replace('/')} aria-label="뒤로">
              <svg viewBox="0 0 34 20" aria-hidden="true">
                <path d="M10.5 2 2 10l8.5 8M2 10h31" fill="none" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <h1 className="gd__title">파수꾼 코드 지도</h1>
          <p className="gd__lead">
            활동 장소와 운영 시간을 확인하고
            {'\n'}가장 가까운 파수꾼 코드부터 찾아보세요.
          </p>
        </header>

        {/* 추후 지도 일러스트로 교체할 자리 */}
        <div className="cm__art">지도 삽입</div>

        {SPOT_GROUPS.map(g => (
          <section key={g.group} className="cm__group">
            <h2 className="cm__grouphead">{g.group}</h2>
            <div className="gd__acc">
              {g.items.map(s => {
                const state = stateOf(s.code);
                return (
                  <section key={s.code} className="gd__sec">
                    <button type="button" className="gd__row" aria-expanded={open === s.code}
                            onClick={() => setOpen(o => (o === s.code ? null : s.code))}>
                      <span className="gd__rowlabel">
                        {state === '해결' && <Sparkle className="gd__rowstar" />}
                        {s.name}
                      </span>
                      {state && (
                        <span className={`badge ${state === '해결' ? 'done' : ''} mq__count`}>{state}</span>
                      )}
                      <i className={`gd__sign${open === s.code ? ' is-open' : ''}`} aria-hidden="true" />
                    </button>

                    {open === s.code && (
                      <div className="gd__body">
                        {s.sub && <p className="cm__sub">{s.sub}</p>}
                        <dl className="cm__info">
                          <dt>주소</dt><dd>{s.address}</dd>
                          {s.hours && <><dt>운영</dt><dd>{s.hours}</dd></>}
                          {s.tel && <><dt>문의</dt><dd><a href={`tel:${s.tel}`}>{s.tel}</a></dd></>}
                        </dl>
                        {s.notes?.map(n => <p key={n} className="cm__note">※ {n}</p>)}
                        {s.link && (
                          <a className="btn sm cm__link" href={s.link.url} target="_blank" rel="noreferrer">
                            {s.link.label}
                          </a>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <SheetNav />
    </div>
  );
}

export default function Page() { return <Protected><CodeMap /></Protected>; }
