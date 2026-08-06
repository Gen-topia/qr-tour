'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import AudioPlayer from '@/components/AudioPlayer';
import HintModal from '@/components/HintModal';
import PhotoShare from '@/components/PhotoShare';

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

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!steps) return <div className="screen center"><div className="lantern" /></div>;
  if (result) return <ResultView result={result} onHome={() => router.replace('/')} />;

  const step = steps[idx];
  const isLast = idx >= steps.length - 1;
  const next = () => { if (!isLast) setIdx(i => i + 1); };

  return (
    <div className="screen stack">
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
      {step.type === 'quiz' && (
        <QuizStep questId={id} step={step} setErr={setErr}
          onCorrect={(r) => r.isFinal ? setResult({ awarded: r.awarded, alreadyCleared: r.alreadyCleared }) : next()} />
      )}
    </div>
  );
}

function QuizStep({ questId, step, onCorrect, setErr }) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const options = Array.isArray(step.options) ? step.options : null;
  async function submit(val) {
    setBusy(true); setWrong(false);
    try { const r = await api.submitAnswer(questId, step.id, val ?? answer); r.correct ? onCorrect(r) : setWrong(true); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 퀴즈</div>
      <p style={{ margin: 0 }}>{step.question}</p>
      {options
        ? options.map((op, i) => <button key={i} className="btn ghost" disabled={busy} onClick={() => submit(op)}>{op}</button>)
        : (<><input className="input" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="정답 입력" />
            <button className="btn" disabled={busy || !answer.trim()} onClick={() => submit()}>제출</button></>)}
      {wrong && <p style={{ color: 'var(--talisman)', margin: 0 }}>정답이 아니에요. 다시 시도해 보세요.</p>}
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
