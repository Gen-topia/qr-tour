'use client';
import { useState } from 'react';

// 퀴즈 — options가 있으면 보기에서 고르고, 없으면 직접 입력한다.
// 정답 확인은 어느 쪽이든 서버가 한다.
// 힌트는 화면 아래 '이전으로 · 메인으로' 사이에 둔다(quest/[id]/page.jsx).
export default function QuizStep({ step, submit }) {
  const options = Array.isArray(step.options) ? step.options : null;
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(value) {
    setBusy(true); setWrong(false);
    const ok = await submit(value);
    if (!ok) setWrong(true);
    setBusy(false);
  }

  return (
    <div className="card stack">
      <div className="eyebrow">미션 · 퀴즈</div>
      <p style={{ margin: 0 }}>{step.question}</p>

      {options ? (
        <div className="choice">
          {options.map((opt, i) => (
            <button key={opt} type="button" className="choice__item"
                    disabled={busy} onClick={() => send(opt)}>
              <span className="choice__no">{i + 1}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <input className="input" value={answer}
                 onChange={e => { setAnswer(e.target.value); setWrong(false); }}
                 placeholder="정답 입력"
                 onKeyDown={e => e.key === 'Enter' && answer.trim() && !busy && send(answer)} />
          <button className="btn" disabled={busy || !answer.trim()} onClick={() => send(answer)}>제출</button>
        </>
      )}

      {wrong && (
        <p style={{ color: 'var(--talisman)', margin: '20px 0 4px', textAlign: 'center', whiteSpace: 'pre-line' }}>
          {'정답이 아니에요.\n다시 시도해 보세요.'}
        </p>
      )}

      {/* 정답이 아직 정해지지 않은 문제 — config에 skip이 있을 때만 나온다 */}
      {step.config?.skip && (
        <button type="button" className="btn ghost" disabled={busy}
                onClick={() => send({ skip: true })}>넘어가기</button>
      )}
    </div>
  );
}
