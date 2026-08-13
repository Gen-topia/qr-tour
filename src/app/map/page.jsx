'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import Loading from '@/components/Loading';
import { api } from '@/lib/apiClient';
import { SPOT_GROUPS } from '@/lib/spots';

function CodeMap() {
  const [quests, setQuests] = useState(null);
  const [err, setErr] = useState('');
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
    <div className="screen fade-in">
      <div className="eyebrow">코드 지도</div>
      <h1 style={{ marginTop: 4 }}>전체 과업 지도</h1>
      <p className="muted" style={{ marginTop: 0 }}>활동 장소와 운영 시간을 확인하고 가장 가까운 파수꾼 코드부터 찾아보세요.</p>

      {SPOT_GROUPS.map(g => (
        <section key={g.group} className="spots">
          <h2 className="spots__group">{g.group}</h2>
          {g.items.map(s => {
            const state = stateOf(s.code);
            return (
              <div key={s.code} className="card spot">
                <div className="spread">
                  <div>
                    <div className="spot__name">{s.name}</div>
                    {s.sub && <div className="spot__sub">{s.sub}</div>}
                  </div>
                  {state && <span className={`badge ${state === '해결' ? 'done' : ''}`}>{state}</span>}
                </div>
                <dl className="spot__info">
                  <dt>주소</dt><dd>{s.address}</dd>
                  {s.hours && <><dt>운영</dt><dd>{s.hours}</dd></>}
                  {s.tel && <><dt>문의</dt><dd><a href={`tel:${s.tel}`}>{s.tel}</a></dd></>}
                </dl>
                {s.notes?.map(n => <p key={n} className="spot__note">※ {n}</p>)}
                {s.link && (
                  <a className="btn ghost sm" href={s.link.url} target="_blank" rel="noreferrer">{s.link.label}</a>
                )}
              </div>
            );
          })}
        </section>
      ))}

      <div className="grow" />
      <button className="btn ghost" onClick={() => router.replace('/')}>메인으로</button>
    </div>
  );
}

export default function Page() { return <Protected><CodeMap /></Protected>; }
