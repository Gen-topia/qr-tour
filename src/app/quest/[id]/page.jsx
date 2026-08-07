'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import AudioPlayer from '@/components/AudioPlayer';
import HintModal from '@/components/HintModal';
import PhotoShare from '@/components/PhotoShare';
import Loading from '@/components/Loading';
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

  useEffect(() => {
    api.questSteps(id).then(r => setSteps(r.steps)).catch(e => setErr(e.message));
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
  if (result) return <ResultView result={result} onHome={() => router.replace('/')} />;

  const step = steps[idx];
  const isLast = isLastStep;
  const next = () => { if (!isLast) setIdx(i => i + 1); };
  const Play = PLAY_COMPONENTS[step.type];

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

      {step.type === 'story' && (<><div className="grow" /><button className="btn" onClick={next} disabled={isLast}>{isLast ? '마지막 장' : '다음'}</button></>)}
      {step.type === 'photo' && (<><PhotoShare /><div className="grow" /><button className="btn" onClick={next}>다음</button></>)}
      {Play && <Play key={step.id} step={step} submit={submit} />}
    </div>
  );
}

function ResultView({ result, onHome }) {
  return (
    <div className="screen center stack">
      <div className="grow" /><div className="lantern" style={{ width: 84, height: 84 }} />
      <div className="eyebrow">미션 완료</div>
      <h1>{result.alreadyCleared ? '이미 완료한 미션' : `+${result.awarded}점 획득`}</h1>
      <p className="muted">결과가 저장되었어요.</p>
      <PhotoShare shareOnly />
      <div className="grow" />
      <button className="btn" onClick={onHome}>메인으로</button>
    </div>
  );
}
export default function Page() { return <Protected><Quest /></Protected>; }
