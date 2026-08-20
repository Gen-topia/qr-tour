'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';
import SheetNav from '@/components/SheetNav';
import Sparkle from '@/components/Sparkle';
import { QUEST_TABS, QUEST_REQUIRES, groupLabel } from '@/lib/questGroups';

// 퀘스트 진행 이미지 — public/quest_{퀘스트번호}_{완수한 메인 퀘스트 수}.png
// 하나도 못 깬 0단계에는 갓 돋은 새싹을 보여준다.
// 아직 준비되지 않은 단계의 그림은 깨진 이미지 대신 조용히 숨긴다.
function QuestImage({ group, done, label }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [group, done]);
  if (done < 0 || broken) return null;
  return (
    <img className="qhero" src={`/quest_${group}_${done}.png`} alt={`${label} 진행 이미지`}
         onError={() => setBroken(true)} />
  );
}

// 서브 퀘스트(QR)를 메인 퀘스트별로 묶는다. QR은 미션마다 따로이고,
// 한 메인 퀘스트에 속한 미션을 모두 깨야 그 퀘스트가 완수된다.
function toMains(list) {
  const mains = [];
  for (const q of list) {
    const found = mains.find(m => m.no === q.main_no);
    if (found) found.items.push(q);
    else mains.push({ no: q.main_no, title: q.main_title || q.title, items: [q] });
  }
  return mains;
}

function Missions() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState(0);          // QUEST_TABS의 인덱스
  const [open, setOpen] = useState(null);     // 펼쳐 둔 메인 퀘스트 키
  const router = useRouter();
  useEffect(() => { api.myMissions().then(setData).catch(e => setErr(e.message)); }, []);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!data) return <Loading label="퀘스트를 불러오는 중…" />;

  const g = QUEST_TABS[tab];
  const list = data.quests.filter(q => q.quest_group === g.value);
  const mains = toMains(list);
  const mainsDone = mains.filter(m => m.items.every(q => q.cleared)).length;

  // 선행 퀘스트를 모두 완수해야 열리는 퀘스트라면 조건을 함께 알려준다
  const needGroup = QUEST_REQUIRES[g.value];
  const need = needGroup ? data.quests.filter(q => q.quest_group === needGroup) : [];
  const needDone = need.filter(q => q.cleared).length;
  const openable = need.length === 0 || needDone >= need.length;

  return (
    <div className="onboard sheet gd mq">
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
          <h1 className="gd__title">나의 퀘스트</h1>
          <p className="gd__lead">
            {data.user?.nickname ? `${data.user.nickname} 수호자님, ` : ''}
            {`지금까지 ${data.progress.done}/${data.progress.total} 미션을 완수했습니다.`}
          </p>
        </header>

        <div className="mq__tabs" role="tablist">
          {QUEST_TABS.map((t, i) => (
            <button key={t.value} type="button" role="tab" aria-selected={i === tab}
              className={`mq__tab${i === tab ? ' is-on' : ''}`}
              onClick={() => { setTab(i); setOpen(null); }}>
              {t.label}
            </button>
          ))}
        </div>

        <QuestImage group={g.value} done={mainsDone} label={g.label} />

        {need.length > 0 && (
          <p className={`qreq${openable ? ' qreq--open' : ''}`}>
            {openable
              ? `${groupLabel(needGroup)}을 모두 완수했어요. ${g.label}에 도전할 수 있습니다.`
              : `${groupLabel(needGroup)}의 모든 퀘스트를 완수해야 ${g.label}에 도전할 수 있어요. (${needDone}/${need.length} 완수)`}
          </p>
        )}

        {/* 지침서와 같은 아코디언 — '+'를 누르면 그 퀘스트의 세부 미션이 열린다 */}
        <div className="gd__acc">
          {mains.map(m => {
            const key = `${g.value}-${m.no}`;
            const done = m.items.filter(q => q.cleared).length;
            const all = m.items.length > 0 && done === m.items.length;
            return (
              <section key={key} className="gd__sec">
                <button type="button" className="gd__row" aria-expanded={open === key}
                        onClick={() => setOpen(o => (o === key ? null : key))}>
                  <span className="gd__rowlabel">
                    {all && <Sparkle className="gd__rowstar" />}
                    {m.title}
                  </span>
                  <span className="mq__count">{done}/{m.items.length}</span>
                  <i className={`gd__sign${open === key ? ' is-open' : ''}`} aria-hidden="true" />
                </button>

                {open === key && (
                  <div className="gd__body">
                    {m.items.map(q => (
                      <article key={q.id} className="mq__item">
                        <div className="mq__itemhead">
                          <h2>{q.title}</h2>
                          <span className={`badge ${q.cleared ? 'done' : ''}`}>
                            {q.cleared ? '완수' : '미완수'}
                          </span>
                        </div>
                        <p className="mq__itemnote">
                          {q.cleared
                            ? '이미 완수한 미션이에요.'
                            : '현장의 파수꾼 코드를 찾아 비추면 시작됩니다.'}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {mains.length === 0 && <p className="muted" style={{ padding: '18px 0' }}>아직 퀘스트가 없어요.</p>}
        </div>
      </div>

      <SheetNav />
    </div>
  );
}
export default function Page() { return <Protected><Missions /></Protected>; }
