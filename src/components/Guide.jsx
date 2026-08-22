'use client';
import { useEffect, useRef, useState } from 'react';
import Sparkle from '@/components/Sparkle';
import SheetNav from '@/components/SheetNav';

// 6. 수호자 지침서 — reference/screens/메인 - 수호자 지침서*.png 그대로
// 아코디언: 닫힘 '+' / 열림 '−'

const LEAD = `반가워요, 수호자님!
곧 다가올 8월 백중날 지옥문이 열리기 전까지
수호자님이 완수해야 할 3대 과업을 말씀드립니다.
꼭! 완수하여 제주의 눈부신 내일을 만들어 주세요.`;

const INFO_NOTE = `이야기를 따라 ‘온라인 공간’과
제주의 ‘현실 공간’을 넘나들며 제주 유산을
체험하는 대체현실게임투어입니다.
온라인 공간의 지침과 제주의 지형지물을
이용해 각자만의 이야기 여행을 완성하세요.`;

const INFO = [
  ['장소', '제주도 일원'],
  ['장르', '대체현실게임투어'],
  ['내용', '사라진 제주 신들을\n찾아 떠나는 신비로운 여정'],
  ['연령', '만 7세 이상 누구나'],
];

const TASKS = [
  ['제주의 유산에\n깃든 가치',
   `측간신의 동티로 어둠에 물든
제주의 유산을 찾아가
그 가치를 회복시켜주세요.
유산의 정기가 되살아날 때마다
결계 속 복숭아나무의 생명력이
차오릅니다.`],
  ['제주의 상생과 포용의\n어울림',
   `냄새 콤플렉스로 삐뚤어진 측간신을
찾아 오랜 외로움을 달래 주세요.
재앙의 시작이 된 그의 열등감을
따뜻한 온기로 정화하면
더 이상의 액운을 막을 수 있습니다.
그리고 그를 다시 제주의 복된
수호신으로 품어주세요.`],
  ['일만 팔천 신들의 고향,\n신비로운 섬 제주',
   `무사히 키워낸 열쇠(복숭아 씨앗)로
오랫동안 닫혀있던 하늘 문을 열고,
사라진 일만 팔천
신들을 제주로 복귀시켜 주세요.`],
];

const SCHEDULE = [
  ['작전 기간', '2026. 8. 24.(월) - 9. 6.(일)\n단 14일간'],
  ['퀘스트 수행', '오전 9시 - 오후 9시'],
  ['본부 운영', '오전 9시 - 오후 6시'],
  ['본부 위치', '제주시 삼도이동 향사당'],
  ['본부 연락처', '010-0000-0000'],
];

const SCHEDULE_NOTES = [
  '수호자님의 속도에 맞춰 여유롭게 완수해 주세요.',
  '‘첫 출발’과 ‘최종 과업 완수 인증’은 안내자가 상주하는 본부 운영 시간에만 가능합니다.',
  '오후 6시 이후에는 완수 인증을 확인할 수 없습니다. 늦은 밤 모든 퀘스트를 마치셨다면 다음 날 운영 시간에 맞춰 인증해 주세요.',
  '수행 중 어려움이 생기면 본부로 문의해 주세요.',
];

// ==...== 구간은 형광펜 표시
const RULES = [
  ['오디오 안내',
   `이야기를 ==소리로 들으며==
활동하면 더욱 생생한 투어가
완성됩니다.

다른 분들에게 방해가 되지
않도록 ==이어폰 사용을==
권장합니다.`],
  ['안전 수칙',
   `이동할 때나 오디오 안내가
없을 때는 이어폰을 빼고,
화면 대신 ==주변을 살피며==
걸어주세요.

퀘스트 수행 지역은 ==차량 통제가
불가능한 일반 관광지입니다.==
장난치거나 뛰지 마시고,
차도로 이동하지 말아 주세요.

다른 분들과의 질서를 지켜 더욱
==안전한 이야기 여행이==
되기를 바랍니다.`],
];

const marked = (text) =>
  text.split(/==([\s\S]+?)==/).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));

// 과업마다 곁들이는 그림 — public/guide/task_{번호}.png
// 파일이 없으면 그림 없이 글만 보인다.
function TaskArt({ no }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="gd__taskart" src={`/guide/task_${no}.png`} alt=""
              onError={() => setFailed(true)} />;
}

// 지침서를 열면 함께 흐르는 안내 음성 — public/guide/guide.mp3
// 파일이 없거나 재생이 막히면 조용히 사라진다(브라우저가 자동재생을 막으면 버튼으로 켠다).
function GuideAudio({ src = '/guide/guide.mp3' }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  if (missing) return null;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <>
      <audio ref={ref} src={src} preload="auto"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)} onError={() => setMissing(true)} />
      <button type="button" className="gd__audio" onClick={toggle}
              aria-label={playing ? '안내 음성 일시정지' : '안내 음성 듣기'}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {playing
            ? <path d="M7.4 5.2h3.3v13.6H7.4zM13.3 5.2h3.3v13.6h-3.3z" />
            : <path d="M8 5.2v13.6L18.4 12z" />}
        </svg>
      </button>
    </>
  );
}

const SECTIONS = [
  { key: 'info', title: '프로그램 기본 정보' },
  { key: 'task', title: '3대 과업' },
  { key: 'ops',  title: '운영안내' },
  { key: 'rule', title: '반드시 숙지해 주세요', star: true },
];

export default function Guide({ onDone }) {
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen(o => (o === key ? null : key));

  return (
    <div className="onboard sheet gd">
      <div className="sheet__panel">
        <header className="gd__hero">
          <div className="gd__toolbar">
            <button type="button" className="gd__back" onClick={onDone} aria-label="뒤로">
              <svg viewBox="0 0 34 20" aria-hidden="true">
                <path d="M10.5 2 2 10l8.5 8M2 10h31" fill="none" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <GuideAudio />
          </div>
          <h1 className="gd__title">수호자 지침서</h1>
          <p className="gd__lead">{LEAD}</p>
        </header>

        <div className="gd__acc">
          {SECTIONS.map(s => (
            <section key={s.key} className="gd__sec">
              <button type="button" className="gd__row" aria-expanded={open === s.key}
                      onClick={() => toggle(s.key)}>
                <span className="gd__rowlabel">
                  {s.star && <Sparkle className="gd__rowstar" />}
                  {s.title}
                </span>
                <i className={`gd__sign${open === s.key ? ' is-open' : ''}`} aria-hidden="true" />
              </button>

              {open === s.key && (
                <div className="gd__body">
                  {s.key === 'info' && (
                    <>
                      <p className="gd__pink">{INFO_NOTE}</p>
                      <dl className="gd__table">
                        {INFO.map(([k, v]) => (
                          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                        ))}
                      </dl>
                    </>
                  )}

                  {s.key === 'task' && TASKS.map(([t, d], i) => (
                    <article key={t} className={`gd__task${i % 2 ? ' gd__task--flip' : ''}`}>
                      <div className="gd__taskhead">
                        <TaskArt no={i + 1} />
                        <div className="gd__tasktext">
                          <span className="gd__tasknum">{i + 1}</span>
                          <h2>{t}</h2>
                        </div>
                      </div>
                      <p className="gd__taskbody">{d}</p>
                    </article>
                  ))}

                  {s.key === 'ops' && (
                    <>
                      <dl className="gd__table">
                        {SCHEDULE.map(([k, v]) => (
                          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                        ))}
                      </dl>
                      <ul className="gd__notes">
                        {SCHEDULE_NOTES.map(n => <li key={n}>{n}</li>)}
                      </ul>
                    </>
                  )}

                  {s.key === 'rule' && RULES.map(([t, body]) => (
                    <article key={t} className="gd__rule">
                      <div className="gd__rulehead">
                        <Sparkle className="gd__rulestar" />
                        <i />
                        <Sparkle className="gd__rulestar" />
                      </div>
                      <h2>{t}</h2>
                      <p>{marked(body)}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <SheetNav onHome={onDone} />
    </div>
  );
}
