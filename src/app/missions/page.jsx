'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';
import SheetNav from '@/components/SheetNav';
import InfoModal from '@/components/InfoModal';
import Sparkle from '@/components/Sparkle';
import { QUEST_TABS, QUEST_REQUIRES, requireLabel } from '@/lib/questGroups';

// 진행 그림이 있는 퀘스트 — 1은 복숭아나무, 2는 측간신. 퀘스트3은 그림이 없다.
// 값은 '몇 개 깼는지'를 그림 번호로 옮기는 몫 — 퀘스트1은 1개 깨면 _0부터,
// 퀘스트2는 1개 깨면 _1부터 쓴다(_0은 아직 아무것도 안 깬 측간신이라 건너뛴다).
const HERO_OFFSET = { 1: -1, 2: 0 };

// 퀘스트 그림 한 장 — 다 실리면 is-on이 붙는다.
// '실렸다·깨졌다'를 참/거짓으로 두면 그림이 바뀔 때 되돌려야 하는데, 그 사이에
// 캐시에 있던 그림이 먼저 onLoad를 쏴서 표시가 지워진다(그림이 투명한 채로 남아
// 흰 자리만 보인다). 그래서 '어느 주소가' 실렸는지·몇 번 실패했는지를 기억한다.
// 실패는 한 번 더 불러본 뒤에야 포기한다 — 이동 통신에서 요청이 한 번 끊겼다고
// 그림이 영영 빈 자리로 굳지 않게(주소를 바꿔야 브라우저가 다시 받아온다).
function QuestPic({ className, src, alt, style }) {
  const [shown, setShown] = useState('');
  const [fails, setFails] = useState({});
  const tried = fails[src] || 0;
  if (tried > 1) return null;
  return (
    <img key={`${src}#${tried}`} className={`${className}${shown === src ? ' is-on' : ''}`}
         src={tried ? `${src}?retry=${tried}` : src} alt={alt}
         onLoad={() => setShown(src)}
         onError={() => setFails(f => ({ ...f, [src]: (f[src] || 0) + 1 }))} />
  );
}

// 위쪽이 크게 비어 있어 흰 칸으로만 보이는 그림은 그 빈 자리를 잘라 아래쪽만 보여준다.
// (새싹 그림은 731×1024 중 아래 388px에만 그림이 있다 — 그림을 다시 그리면 여기도 함께 손본다)
const HERO_CROP = { '/quest_1_0.png': { aspectRatio: '731 / 420', objectFit: 'cover', objectPosition: 'bottom' } };

// 퀘스트 진행 이미지 — public/quest_{퀘스트번호}_{단계}.png
// 하나도 못 깼을 때는 삽화(quest_{번호}.png)만 보이고, 하나를 깬 순간부터
// 진행 그림으로 바뀐다. 그림 번호는 HERO_OFFSET이 정한다.
// 아직 준비되지 않은 단계의 그림은 깨진 이미지 대신 조용히 숨긴다.
function QuestImage({ group, done, label }) {
  const offset = HERO_OFFSET[group];
  const src = `/quest_${group}_${done + offset}.png`;
  if (offset === undefined || done < 1) return null;
  return <QuestPic className="qhero" src={src} style={HERO_CROP[src]}
                   alt={`${label} 진행 이미지`} />;
}

// 퀘스트 삽화 — public/quest_{퀘스트번호}.png
// 탭을 바꾸면 새 그림이 다 실릴 때까지 이전 그림이 남지 않게 감춰 둔다.
function QuestArt({ group, label }) {
  return <QuestPic className="mq__art" src={`/quest_${group}.png`} alt={`${label} 삽화`} />;
}

// 하늘 문 열쇠 — public/sky_key.png. 파일이 없으면 글만 남는다.
function KeyImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="skykey__img" src="/sky_key.png" alt="하늘 문 열쇠" onError={() => setFailed(true)} />;
}

// 짧은 효과음 — public/audio/quest1-clear/{이름}.wav
const playSfx = (name) => { new Audio(`/audio/quest1-clear/${name}.wav`).play().catch(() => {}); };

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
  // 퀘스트를 완수하고 넘어올 때는 ?quest=1처럼 볼 탭을 지정해 온다.
  // 이야기가 남아 다음 미션을 찾아야 하면 ?main=1처럼 펼쳐 둘 이야기까지 함께 온다.
  const params = useSearchParams();
  const asked = params.get('quest');
  const askedMain = params.get('main');
  const wanted = QUEST_TABS.findIndex(t => String(t.value) === asked);
  const [tab, setTab] = useState(wanted < 0 ? 0 : wanted);   // QUEST_TABS의 인덱스
  const [open, setOpen] = useState(askedMain ? `${asked}-${askedMain}` : null);   // 펼쳐 둔 메인 퀘스트 키
  // 복숭아 따기 연출 — '' → picking(나무가 스러진다) → key(열쇠) → quest3(열림 안내)
  const [phase, setPhase] = useState('');
  const router = useRouter();
  useEffect(() => {
    const load = () => api.myMissions().then(setData).catch(e => setErr(e.message));
    load();
    // 미션을 완수하고 돌아오면 목록이 바뀌어 있어야 한다.
    // 모바일 브라우저는 뒤로 가기로 돌아올 때 화면을 통째로 되살려(bfcache) 처음 받아둔
    // 목록을 그대로 보여주므로, 되살아나거나 다시 화면에 들어올 때 새로 받아 온다.
    const back = (e) => { if (e.persisted) load(); };
    const shown = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('pageshow', back);
    document.addEventListener('visibilitychange', shown);
    return () => {
      window.removeEventListener('pageshow', back);
      document.removeEventListener('visibilitychange', shown);
    };
  }, []);

  // 펼쳐 둘 이야기를 지정해 왔으면, 그 안의 미션이 바로 보이도록 맨 아래까지 내려준다
  // (이 화면은 창이 아니라 바깥 상자가 구르므로 그 상자를 움직인다)
  const boxRef = useRef(null);
  useEffect(() => {
    if (!data || !askedMain) return;
    const box = boxRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  }, [data, askedMain]);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!data) return <Loading label="퀘스트를 불러오는 중…" />;

  const g = QUEST_TABS[tab];
  const list = data.quests.filter(q => q.quest_group === g.value);
  const mains = toMains(list);
  const mainsDone = mains.filter(m => m.items.every(q => q.cleared)).length;

  // 선행 퀘스트를 모두 완수해야 열리는 퀘스트라면 조건을 함께 알려준다
  const needGroups = QUEST_REQUIRES[g.value] || [];
  const need = data.quests.filter(q => needGroups.includes(q.quest_group));
  const needDone = need.filter(q => q.cleared).length;
  const openable = need.length === 0 || needDone >= need.length;

  // 열쇠를 얻어도 퀘스트2가 남았으면 퀘스트3은 아직 잠겨 있다 — '열렸습니다' 안내를 띄우지 않는다
  const quest3Open = data.quests
    .filter(q => (QUEST_REQUIRES[3] || []).includes(q.quest_group))
    .every(q => q.cleared);

  // 퀘스트1을 모두 완수했는데 아직 열쇠를 얻지 않았다면, 나무의 복숭아를 딸 수 있다
  const canPick = g.value === 1 && mains.length > 0 && mainsDone === mains.length && !data.skyKey;

  // 복숭아 따기 — 띠링(pick) 하고 나무가 스러진 뒤 열쇠(key)가 뜬다
  const pickPeach = async () => {
    if (phase) return;
    setPhase('picking');
    playSfx('pick');
    try {
      await api.claimSkyKey();
      setData(d => ({ ...d, skyKey: true }));
    } catch (e) { setErr(e.message); return; }
    setTimeout(() => { playSfx('key'); setPhase('key'); }, 900);
  };

  return (
    <div className="onboard sheet gd mq" ref={boxRef}>
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
            {`지금까지 ${data.progress.done}/${data.progress.total} 퀘스트를 완수했습니다.`}
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

        {/* 이 퀘스트가 무엇을 하는 여정인지 */}
        {g.title && (
          <section className="mq__intro">
            <h2 className="mq__introtitle">{g.title}</h2>
            <p className="mq__introdesc">{g.desc}</p>
            {/* 삽화는 아직 아무것도 못 깼을 때만 — 하나라도 깨면 진행 그림이 대신 나온다.
                퀘스트3은 진행 그림이 없어 열쇠를 얻은 뒤 계속 삽화를 보여준다 */}
            {(g.value === 3 || mainsDone === 0) && <QuestArt group={g.value} label={g.label} />}
          </section>
        )}

        {/* 열쇠를 얻은 뒤로 퀘스트1 자리는 복숭아나무 대신 하늘 문 열쇠를 보여준다 */}
        {g.value === 1 && data.skyKey ? (
          <img className="qhero is-on qhero--key" src="/sky_key.png" alt="하늘 문 열쇠" />
        ) : canPick ? (
          <button type="button" className={`peach${phase === 'picking' ? ' is-picking' : ''}`}
                  onClick={pickPeach} disabled={!!phase}>
            <QuestImage group={g.value} done={mainsDone} label={g.label} />
            <span className="peach__hint">복숭아를 터치하세요</span>
          </button>
        ) : (
          <QuestImage group={g.value} done={mainsDone} label={g.label} />
        )}

        {g.value === 1 && data.skyKey && <p className="qkey">하늘 문 열쇠를 얻었습니다.</p>}

        {g.value === 1 && <p className="qreq">퀘스트1은 순서에 상관없이 진행해주세요.</p>}
        {g.value === 2 && <p className="qreq">퀘스트2는 순서에 따라 진행해주세요.</p>}

        {need.length > 0 && (
          <p className={`qreq${openable ? ' qreq--open' : ''}`}>
            {openable
              ? `${requireLabel(needGroups)}를 모두 완수했어요. ${g.label}에 도전할 수 있습니다.`
              : `${requireLabel(needGroups)}의 모든 퀘스트를 완수해야 ${g.label}에 도전할 수 있어요. (${needDone}/${need.length} 완수)`}
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

      {phase === 'key' && (
        <InfoModal eyebrow="퀘스트1 완수" title="하늘 문 열쇠를 얻었습니다"
                   confirmLabel="확인" onClose={() => setPhase(quest3Open ? 'quest3' : '')}>
          <KeyImage />
          <p style={{ margin: '10px 0 0' }}>
            유산의 정기로 열린 복숭아가 하늘 문 열쇠가 되었습니다.
          </p>
        </InfoModal>
      )}
      {phase === 'quest3' && (
        <InfoModal eyebrow="새로운 여정" title="퀘스트3이 열렸습니다"
                   confirmLabel="하늘 문으로"
                   onClose={() => { setPhase(''); setOpen(null); setTab(QUEST_TABS.findIndex(t => t.value === 3)); }}>
          하늘 문을 열고, 사라진 일만 팔천 신들을 되찾아 주세요.
        </InfoModal>
      )}

      <SheetNav />
    </div>
  );
}
// useSearchParams를 쓰므로 Suspense로 감싼다(빌드 오류 방지)
export default function Page() {
  return (
    <Protected>
      <Suspense fallback={<Loading label="퀘스트를 불러오는 중…" />}><Missions /></Suspense>
    </Protected>
  );
}
