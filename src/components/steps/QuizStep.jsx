'use client';
import { useState } from 'react';

// 주관식 — 정답 입력 후 제출. 검증은 서버가 한다.
export default function QuizStep({ step, submit }) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true); setWrong(false);
    const ok = await submit(answer);
    if (!ok) setWrong(true);
    setBusy(false);
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 퀴즈</div>
      <p style={{ margin: 0 }}>{step.question}</p>
      <input className="input" value={answer} onChange={e => { setAnswer(e.target.value); setWrong(false); }}
        placeholder="정답 입력" onKeyDown={e => e.key === 'Enter' && answer.trim() && !busy && onSubmit()} />
      <button className="btn" disabled={busy || !answer.trim()} onClick={onSubmit}>제출</button>
      {wrong && <p style={{ color: 'var(--talisman)', margin: 0 }}>정답이 아니에요. 다시 시도해 보세요.</p>}
    </div>
  );
}
