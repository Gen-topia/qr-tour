'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import AudioPlayer from '@/components/AudioPlayer';
import HintModal from '@/components/HintModal';
import PhotoShare from '@/components/PhotoShare';
import Loading from '@/components/Loading';
import Prologue from '@/components/Prologue';
import Sparkle from '@/components/Sparkle';
import QuizStep from '@/components/steps/QuizStep';
import PuzzleStep from '@/components/steps/PuzzleStep';
import ScratchStep from '@/components/steps/ScratchStep';
import GaugeStep from '@/components/steps/GaugeStep';
import DialStep from '@/components/steps/DialStep';

const PLAY_COMPONENTS = { quiz: QuizStep, puzzle: PuzzleStep, scratch: ScratchStep, gauge: GaugeStep, dial: DialStep };

function Quest() {
  const { id } = useParams();
  const router = useRouter();
  const [quest, setQuest] = useState(null);
  const [steps, setSteps] = useState(null);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [narration, setNarration] = useState(false);

  useEffect(() => {
    api.questSteps(id).then(r => { setQuest(r.quest); setSteps(r.steps); }).catch(e => setErr(e.message));
  }, [id]);

  const stepId = steps?.[idx]?.id;
  const isLastStep = steps ? idx >= steps.length - 1 : false;

  // 모든 유형이 공유하는 제출 — 통과했으면 true를 돌려준다.
  const submit = useCallback(async (payload) => {
    try {
      const r = await api.submitAnswer(id, stepId, payload);
      if (!r.correct) return false;
      if (r.isFinal) setResult({ awarded: r.awarded, alreadyCleared: r.alreadyCleared });
      else setIdx(i => i + 1);
      return true;
    } catch (e) { setErr(e.message); return false; }
  }, [id, stepId]);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!steps) return <Loading label="미션을 여는 중…" />;
  if (result) return <ResultView result={result} group={quest?.quest_group} onHome={() => router.replace('/')} />;

  const step = steps[idx];
  const next = () => { if (!isLastStep) setIdx(i => i + 1); };
  const Play = PLAY_COMPONENTS[step.type];

  // 관리툴에 적어둔 이름 → public/{이름}.mp4
  if (narration) return (
    <Prologue src={`/${quest.narration_video}.mp4`} label="나레이션"
              onEnd={() => setNarration(false)} onClose={() => setNarration(false)} />
  );

  // 미션의 첫 화면 — 수호자 지침서와 같은 시트 컨셉
  if (idx === 0) {
    return (
      <div className="sheet qi">
        <div className="sheet__panel qi__panel">
          <div className="qi__head">
            <button type="button" className="sheet__back" onClick={() => router.replace('/')} aria-label="뒤로">
              <svg viewBox="0 0 34 20" aria-hidden="true">
                <path d="M10.5 2 2 10l8.5 8M2 10h31" fill="none" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="qi__eyebrow">{quest?.title || '미션'}</div>
            {step.title && <h1 className="qi__title">{step.title}</h1>}
            {step.body_text && <p className="qi__text">{step.body_text}</p>}
            {(step.image_url || quest?.cover_image_url) &&
              <img className="qi__img" src={step.image_url || quest.cover_image_url} alt="" />}
            <AudioPlayer src={step.audio_url} />
            <HintModal hint={step.hint_text} />
            {Play && <Play key={step.id} step={step} submit={submit} />}
          </div>

          <div className="qi__foot">
            {quest?.narration_video && (
              <button type="button" className="qi__narration" onClick={() => setNarration(true)}>
                <span className="qi__narrationlabel"><Sparkle className="qi__star" />나레이션 듣기</span>
                <svg className="qi__playicon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M9.8 7.8v8.4L16.6 12z" fill="currentColor" />
                </svg>
              </button>
            )}
            {(step.type === 'story' || step.type === 'photo') && (
              <button type="button" className="qi__next" onClick={next} disabled={isLastStep}>
                {isLastStep ? '마지막 장' : '다음'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen stack fade-in">
      <div className="spread">
        <div className="eyebrow">{quest?.title || '미션'}</div>
        <span className="badge">{idx + 1} / {steps.length}</span>
      </div>
      {step.title && <h1 style={{ margin: '4px 0' }}>{step.title}</h1>}
      {step.image_url && <img src={step.image_url} alt="" style={{ width: '100%', borderRadius: 12 }} />}
      {step.body_text && <p style={{ whiteSpace: 'pre-wrap' }}>{step.body_text}</p>}
      <AudioPlayer src={step.audio_url} />
      <HintModal hint={step.hint_text} />

      {step.type === 'story' && (<><div className="grow" /><button className="btn" onClick={next} disabled={isLastStep}>{isLastStep ? '마지막 장' : '다음'}</button></>)}
      {step.type === 'photo' && (<><PhotoShare /><div className="grow" /><button className="btn" onClick={next}>다음</button></>)}
      {Play && <Play key={step.id} step={step} submit={submit} />}
    </div>
  );
}

// 퀘스트별 클리어 이미지 — public/quest_clear_{퀘스트번호}.png, 없으면 이미지 없이 텍스트만
function ClearImage({ group }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [group]);
  if (!group || failed) return null;
  return <img className="qc__img" src={`/quest_clear_${group}.png`} alt="" onError={() => setFailed(true)} />;
}

function ResultView({ result, group, onHome }) {
  return (
    <div className="sheet qc">
      <div className="sheet__panel qc__panel">
        <div className="qc__body">
          <ClearImage group={group} />
          <div className="qc__rule">
            <Sparkle className="qc__star" /><i /><Sparkle className="qc__star" />
          </div>
          <h1 className="qc__title">미션 완료</h1>
          <p className="qc__text">
            {result.alreadyCleared ? '이미 완료한 미션이에요.' : `+${result.awarded}점을 획득했어요.`}
            {'\n'}결과가 저장되었습니다.
          </p>
        </div>
        <div className="qc__foot">
          <PhotoShare shareOnly />
          <button type="button" className="qi__next" onClick={onHome}>메인으로</button>
        </div>
      </div>
    </div>
  );
}
export default function Page() { return <Protected><Quest /></Protected>; }
