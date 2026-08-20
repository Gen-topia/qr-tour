'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';

// 테스트용 — 퀘스트로 바로 건너뛰는 패널.
// 번호는 관리툴의 '순서'(order_no)와 같다. 0은 사전 퀘스트.
export default function TestJump({ onClose }) {
  const [quests, setQuests] = useState(null);
  const [err, setErr] = useState('');
  const [no, setNo] = useState('');
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    api.myMissions()
      .then(r => setQuests([...r.quests].sort((a, b) => a.order_no - b.order_no)))
      .catch(e => setErr(e.message));
    inputRef.current?.focus();
  }, []);

  // 패널 안에서는 Esc로 닫는다
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const go = (id) => { onClose(); router.push(`/quest/${id}`); };

  const submit = (e) => {
    e.preventDefault();
    const n = Number(String(no).trim());
    if (!Number.isInteger(n)) return;
    const target = quests?.find(q => q.order_no === n);
    if (target) go(target.id);
    else setErr(`${n}번 퀘스트가 없습니다.`);
  };

  return (
    <div className="tj" onClick={onClose}>
      <div className="tj__panel" onClick={e => e.stopPropagation()}>
        <div className="tj__head">
          <b>퀘스트 바로가기</b>
          <button type="button" className="tj__x" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <form className="tj__form" onSubmit={submit}>
          <input ref={inputRef} className="input" inputMode="numeric" placeholder="번호 (0 = 사전 퀘스트)"
                 value={no} onChange={e => { setNo(e.target.value); setErr(''); }} />
          <button type="submit" className="btn sm">이동</button>
        </form>
        {err && <p className="tj__err">{err}</p>}

        <div className="tj__list">
          {!quests && !err && <p className="muted" style={{ margin: 0 }}>불러오는 중…</p>}
          {quests?.map(q => (
            <button key={q.id} type="button" className="tj__row" onClick={() => go(q.id)}>
              <span className="tj__no">{q.order_no}</span>
              <span className="tj__title">{q.title}</span>
              {q.cleared && <span className="badge done">완수</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
