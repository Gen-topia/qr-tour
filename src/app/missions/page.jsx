'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import ProgressBar from '@/components/ProgressBar';
import Loading from '@/components/Loading';
import { QUEST_TABS, QUEST_REQUIRES, groupLabel } from '@/lib/questGroups';

// 퀘스트 진행 이미지 — public/quest_{퀘스트번호}_{클리어수}.png
// 하나도 못 깼으면(0단계) 아무것도 보이지 않고, 깬 수만큼 자란 그림을 보여준다.
// 아직 준비되지 않은 단계의 그림은 깨진 이미지 대신 조용히 숨긴다.
function QuestImage({ group, done, label }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [group, done]);
  if (done < 1 || broken) return null;
  return (
    <img className="qhero" src={`/quest_${group}_${done}.png`} alt={`${label} 진행 이미지`}
         onError={() => setBroken(true)} />
  );
}

// 나무 단계는 메인 퀘스트(장소) 단위로 센다.
// QR은 서브 퀘스트마다 따로 있고, 한 메인 퀘스트의 서브 퀘스트를 모두 깨야 한 단계 자란다.
function countMainsDone(list) {
  const nos = [...new Set(list.map(q => q.main_no))];
  return nos.filter(no => list.filter(q => q.main_no === no).every(q => q.cleared)).length;
}

function Missions() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState(0);          // QUEST_TABS의 인덱스
  const trackRef = useRef(null);
  const router = useRouter();
  useEffect(() => { api.myMissions().then(setData).catch(e => setErr(e.message)); }, []);

  // 탭을 누르면 해당 퀘스트로 밀어준다(스와이프는 스크롤이 알아서 처리)
  function goTab(i) {
    setTab(i);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
  }

  // 스와이프로 넘어간 위치를 탭에 반영한다
  function onScroll(e) {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== tab) setTab(i);
  }

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!data) return <Loading label="퀘스트를 불러오는 중…" />;

  return (
    <div className="screen stack fade-in">
      <div className="spread">
        <div><div className="eyebrow">나의 미션</div><h1 style={{ margin: 0 }}>{data.user?.nickname || '참가자'}</h1></div>
        {/* <div className="center"><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--lantern)' }}>{data.totalPoints}</div><div className="muted" style={{ fontSize: 12 }}>점</div></div> */}
      </div>
      <ProgressBar done={data.progress.done} total={data.progress.total} />

      <div className="qtabs" role="tablist">
        {QUEST_TABS.map((g, i) => (
          <button key={g.value} type="button" role="tab" aria-selected={i === tab}
            className={`qtabs__item ${i === tab ? 'is-on' : ''}`} onClick={() => goTab(i)}>
            {g.label}
          </button>
        ))}
      </div>

      <div className="qswipe" ref={trackRef} onScroll={onScroll}>
        {QUEST_TABS.map(g => {
          const list = data.quests.filter(q => q.quest_group === g.value);
          const done = list.filter(q => q.cleared).length;
          const mainsDone = countMainsDone(list);        // 나무 단계
          const mainsTotal = new Set(list.map(q => q.main_no)).size;
          // 선행 퀘스트를 모두 완수해야 열리는 퀘스트라면 조건을 함께 알려준다
          const needGroup = QUEST_REQUIRES[g.value];
          const need = needGroup ? data.quests.filter(q => q.quest_group === needGroup) : [];
          const needDone = need.filter(q => q.cleared).length;
          const openable = need.length === 0 || needDone >= need.length;
          return (
            <section key={g.value} className="qswipe__page" role="tabpanel" aria-label={g.label}>
              <QuestImage group={g.value} done={mainsDone} label={g.label} />
              {need.length > 0 && (
                <p className={`qreq${openable ? ' qreq--open' : ''}`}>
                  {openable
                    ? `${groupLabel(needGroup)}을 모두 완수했어요. ${g.label}에 도전할 수 있습니다.`
                    : `${groupLabel(needGroup)}의 모든 퀘스트를 완수해야 ${g.label}에 도전할 수 있어요. (${needDone}/${need.length} 완수)`}
                </p>
              )}
              {list.length > 0 && (
                <p className="muted" style={{ margin: 0 }}>
                  {g.label} · {mainsDone}/{mainsTotal} 완수 (미션 {done}/{list.length})
                </p>
              )}
              {list.map(q => (
                <div key={q.id} className="card spread">
                  <div>
                    {/* 이 미션이 어느 퀘스트에 속하는지 알려준다(QR은 미션마다 따로다) */}
                    {q.main_title && <div className="muted" style={{ fontSize: 12 }}>{q.main_title}</div>}
                    <div style={{ fontWeight: 700 }}>{q.title}</div>
                  </div>
                  <span className={`badge ${q.cleared ? 'done' : ''}`}>{q.cleared ? '완료' : '미완료'}</span>
                </div>
              ))}
              {list.length === 0 && <p className="muted">아직 미션이 없어요.</p>}
            </section>
          );
        })}
      </div>

      <div className="grow" />
      <button className="btn ghost" onClick={() => router.replace('/')}>메인으로</button>
    </div>
  );
}
export default function Page() { return <Protected><Missions /></Protected>; }
