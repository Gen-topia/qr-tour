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
      if (r.isFinal) setResult({ awarded: r.awarded, alreadyCleared: r.alreadyCleared });
      else setIdx(i => i + 1);
      return true;
    } catch (e) { setErr(e.message); return false; }
  }, [id, stepId]);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!steps) return <Loading label="미션을 여는 중…" />;
  // URL로 바로 들어와도 서버가 잠금을 알려준다
  if (locked) return (
    <>
      <Loading label="미션을 여는 중…" />
      <InfoModal eyebrow="아직 도전할 수 없어요" title="선행 퀘스트를 먼저 완수해 주세요"
                 confirmLabel="확인" onClose={() => router.replace('/')}>
        {locked}
      </InfoModal>
    </>
  );
  if (result) return <ResultView result={result} quest={quest} onHome={() => router.replace('/')} />;

  const step = steps[idx];
  const isLast = isLastStep;
  const next = () => { if (!isLast) setIdx(i => i + 1); };
  const Play = PLAY_COMPONENTS[step.type];

  // 관리툴에 적어둔 이름 → public/{이름}.mp4
  if (narration) return (
    <Prologue src={`/${quest.narration_video}.mp4`} label="나레이션"
              onEnd={() => setNarration(false)} onClose={() => setNarration(false)} />
  );

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
      <HintModal hint={step.hint_text} image={step.hint_image_url} />
      {/* 나레이션 영상은 미션 첫 장에서만 안내한다 */}
      {idx === 0 && quest?.narration_video && (
        <button className="btn ghost" onClick={() => setNarration(true)}>▶ 나레이션 보기</button>
      )}

      {/* 이야기로 끝나는 미션은 마지막 장에서 바로 완수 처리한다 */}
      {step.type === 'story' && (<><div className="grow" /><button className="btn" onClick={isLast ? () => submit({ done: true }) : next}>{isLast ? '미션 완료' : '다음'}</button></>)}
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

function ResultView({ result, quest, onHome }) {
  return (
    <div className="sheet qc">
      <div className="sheet__panel qc__panel">
        <div className="qc__body">
          <ClearImage group={quest?.quest_group} />
          <div className="qc__rule">
            <Sparkle className="qc__star" /><i /><Sparkle className="qc__star" />
          </div>
          <h1 className="qc__title">미션 완료</h1>
          {/* 관리툴에 적어둔 리워드 문구(대본의 '리워드 획득') */}
          {quest?.clear_text && <p className="qc__reward">{quest.clear_text}</p>}
          {/* 완수했을 때 들려주는 소리 — 파일이 없으면 버튼이 뜨지 않는다 */}
          <AudioPlayer src={quest?.clear_audio_url} label="완수 이야기 듣기" />
          <p className="qc__text">
            {result.alreadyCleared ? '이미 완료한 미션이에요.' : `+${result.awarded}점을 획득했어요.`}
            {'\n'}결과가 저장되었습니다.
          </p>
        </div>
        <div className="qc__foot">
          <PhotoShare shareOnly />
          <button className="btn" onClick={onHome}>메인으로</button>
        </div>
      </div>
    </div>
  );
}
export default function Page() { return <Protected><Quest /></Protected>; }
