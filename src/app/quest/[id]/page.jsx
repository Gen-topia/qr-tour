'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import AudioPlayer from '@/components/AudioPlayer';
import HintModal from '@/components/HintModal';
import PhotoShare from '@/components/PhotoShare';
import Loading from '@/components/Loading';
import InfoModal from '@/components/InfoModal';
import Prologue from '@/components/Prologue';
import Sparkle from '@/components/Sparkle';
import QuizStep from '@/components/steps/QuizStep';
import PuzzleStep from '@/components/steps/PuzzleStep';
import ClearStep from '@/components/steps/ClearStep';
import ScratchStep from '@/components/steps/ScratchStep';
import GaugeStep from '@/components/steps/GaugeStep';
import DialStep from '@/components/steps/DialStep';

const PLAY_COMPONENTS = { quiz: QuizStep, puzzle: PuzzleStep, clear: ClearStep, scratch: ScratchStep, gauge: GaugeStep, dial: DialStep };

// 장에 붙는 그림 — 그 장에 적어둔 주소를 먼저 쓰고,
// 없으면 첫 장에 한해 관리툴의 '첫 페이지 이미지 URL'을,
// 그것도 없으면 public/quest_intro_{미션번호}.png를 찾는다.
// 어느 쪽도 없으면 아무것도 그리지 않는다.
function StepImage({ src, fallback }) {
  const url = src || fallback;
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  if (!url || failed) return null;
  return <img src={url} alt="" style={{ width: '100%', borderRadius: 12 }} onError={() => setFailed(true)} />;
}

function Quest() {
  const { id } = useParams();
  const router = useRouter();
  const [quest, setQuest] = useState(null);
  const [steps, setSteps] = useState(null);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [narration, setNarration] = useState(false);
  const [locked, setLocked] = useState('');   // 선행 퀘스트를 못 깬 경우의 안내 문구

  useEffect(() => {
    api.questSteps(id)
      .then(r => { setQuest(r.quest); setLocked(r.locked || ''); setSteps(r.steps); })
      .catch(e => setErr(e.message));
  }, [id]);

  const stepId = steps?.[idx]?.id;
  const isLastStep = steps ? idx >= steps.length - 1 : false;

  // 모든 유형이 공유하는 제출 — 통과했으면 true를 돌려준다.
  const submit = useCallback(async (payload) => {
    try {
      const r = await api.submitAnswer(id, stepId, payload);
      if (!r.correct) return false;
      if (r.isFinal) setResult({ awarded: r.awarded, alreadyCleared: r.alreadyCleared,
                                 mainCleared: r.mainCleared, mainNo: r.mainNo });
      else setIdx(i => i + 1);
      return true;
    } catch (e) { setErr(e.message); return false; }
  }, [id, stepId]);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!steps) return <Loading label="퀘스트를 여는 중…" />;
  // URL로 바로 들어와도 서버가 잠금을 알려준다
  if (locked) return (
    <>
      <Loading label="퀘스트를 여는 중…" />
      <InfoModal eyebrow="아직 도전할 수 없어요" title="선행 퀘스트를 먼저 완수해 주세요"
                 confirmLabel="확인" onClose={() => router.replace('/')}>
        {locked}
      </InfoModal>
    </>
  );
  if (result) return (
    <ResultView result={result} quest={quest}
                onHome={() => router.replace('/')}
                onQuestList={() => router.replace(`/missions?quest=${quest?.quest_group}`)}
                onScan={() => router.replace('/scan')} />
  );

  const step = steps[idx];
  const isLast = isLastStep;
  const next = () => { if (!isLast) setIdx(i => i + 1); };
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const Play = PLAY_COMPONENTS[step.type];

  // 관리툴에 적어둔 이름 → public/{이름}.mp4
  if (narration) return (
    <Prologue src={`/${quest.narration_video}.mp4`} label="나레이션"
              onEnd={() => setNarration(false)} onClose={() => setNarration(false)} />
  );

  // 짧은 안내 장은 화면 대신 모달로 띄운다(관리툴 config에 { "modal": true }).
  // 확인 단추를 누르면 다음 장으로 이어진다.
  if (step.type === 'story' && step.config?.modal) return (
    <>
      <AudioPlayer src={step.audio_url} />
      <InfoModal eyebrow={quest?.title || '미션'} title={step.title}
                 confirmLabel={step.config.cta || '확인'}
                 onClose={isLast ? () => submit({ done: true }) : next}>
        {step.body_text}
      </InfoModal>
    </>
  );

  // 첫 장(활동 안내)은 수호자 지침서와 같은 톤 — 큰 여백, 옅은 본문
  const isIntro = idx === 0;
  return (
    <div className={`screen stack fade-in qpage${isIntro ? ' qintro' : ''}`}>
      <div className="spread">
        <div className="eyebrow">{quest?.title || '미션'}</div>
        <span className="badge">{idx + 1} / {steps.length}</span>
      </div>
      {step.title && <h1 style={{ margin: '4px 0' }}>{step.title}</h1>}
      <StepImage src={step.image_url}
                 fallback={isIntro ? (quest?.cover_image_url || `/quest_intro_${id}.png`) : null} />
      {step.body_text && <p style={{ whiteSpace: 'pre-wrap' }}>{step.body_text}</p>}
      <AudioPlayer src={step.audio_url} />
      {/* 퀴즈는 제출 단추 바로 위에 힌트를 두므로 여기서는 그리지 않는다 */}
      {step.type !== 'quiz' && <HintModal hint={step.hint_text} image={step.hint_image_url} />}
      {/* 나레이션 영상은 미션 첫 장에서만 안내한다 */}
      {idx === 0 && quest?.narration_video && (
        <button className="btn ghost" onClick={() => setNarration(true)}>▶ 나레이션 보기</button>
      )}

      {/* 이야기로 끝나는 미션은 마지막 장에서 바로 완수 처리한다 */}
      {step.type === 'story' && (<><div className="grow" /><button className="btn" onClick={isLast ? () => submit({ done: true }) : next}>{isLast ? '퀘스트 완료' : '다음'}</button></>)}
      {step.type === 'photo' && (<><PhotoShare /><div className="grow" /><button className="btn" onClick={next}>다음</button></>)}
      {Play && <Play key={step.id} step={step} submit={submit} />}

      {/* 첫 장에서는 '다음' 아래에 메인으로 빠져나갈 길을 둔다 */}
      {isIntro && !Play && (
        <button type="button" className="btn outline" onClick={() => router.replace('/')}>이전</button>
      )}

      {/* 문제를 푸는 장에서는 앞 장으로 돌아가거나 그만두고 나갈 수 있어야 한다 */}
      {Play && (
        <div className="qnav">
          <button type="button" className="btn ghost" onClick={prev} disabled={idx === 0}>이전으로</button>
          <button type="button" className="btn ghost" onClick={() => router.replace('/')}>메인으로</button>
        </div>
      )}
    </div>
  );
}

// 완료 화면 그림 — 관리툴에 미션별로 적어둔 주소를 먼저 쓰고,
// 없으면 퀘스트 묶음 공용 그림(public/quest_clear_{그룹번호}.png)을 쓴다.
function ClearImage({ src, group }) {
  const url = src || (group ? `/quest_clear_${group}.png` : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  if (!url || failed) return null;
  return <img className="qc__img" src={url} alt="" onError={() => setFailed(true)} />;
}

// 한 이야기를 모두 완수하면 얻는 정기 그림 — public/quest_spirit_{메인번호}.png
function SpiritImage({ no }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [no]);
  if (!no || failed) return null;
  return <img className="qc__spirit" src={`/quest_spirit_${no}.png`} alt="" onError={() => setFailed(true)} />;
}

function ResultView({ result, quest, onHome, onQuestList, onScan }) {
  // 퀘스트1에서 이야기를 다 끝냈으면 자란 복숭아나무를 보러 가고,
  // 아직 남았으면 다음 코드를 찾으러 보낸다.
  const inQuest1 = quest?.quest_group === 1;
  const toPeach = inQuest1 && result.mainCleared;
  const toScan = inQuest1 && !result.mainCleared;
  return (
    <div className="sheet qc">
      <div className="sheet__panel qc__panel">
        <div className="qc__body">
          <ClearImage src={quest?.clear_image_url} group={quest?.quest_group} />
          <div className="qc__rule">
            <Sparkle className="qc__star" /><i /><Sparkle className="qc__star" />
          </div>
          <h1 className="qc__title">퀘스트 완료</h1>
          {result.mainCleared && <SpiritImage no={result.mainNo} />}
          {/* 관리툴에 적어둔 리워드 문구(대본의 '리워드 획득') */}
          {quest?.clear_text && <p className="qc__reward">{quest.clear_text}</p>}
          {/* 완수했을 때 들려주는 소리 — 파일이 없으면 버튼이 뜨지 않는다 */}
          <AudioPlayer src={quest?.clear_audio_url} />
          <p className="qc__text">
            {result.alreadyCleared ? '이미 완료한 퀘스트에요.' : ``}
          </p>
        </div>
        <div className="qc__foot">
          <button className="btn" onClick={toPeach ? onQuestList : toScan ? onScan : onHome}>
            {toPeach ? '복숭아 나무 보기' : toScan ? '코드 탐색' : '메인으로'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Page() { return <Protected><Quest /></Protected>; }
