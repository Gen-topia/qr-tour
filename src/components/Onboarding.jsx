'use client';

// 로그인 직후 안내 — 프롤로그 → 지침서 → 사전 퀘스트 순서를 알려주고 첫 걸음을 띄운다.
// 오른쪽 위 X로 닫을 수 있다.
const STEPS = [
  ['프롤로그 영상', '이야기의 시작을 먼저 만나요.'],
  ['수호자 지침서', '과업과 규칙을 확인해요.'],
  ['사전 퀘스트', '동자석의 첫 메시지가 도착해요.'],
];

export default function Onboarding({ onStart, onClose }) {
  return (
    <div className="ob" onClick={onClose}>
      <div className="ob__card" onClick={e => e.stopPropagation()}>
        <button type="button" className="ob__x" onClick={onClose} aria-label="닫기">✕</button>

        <div className="ob__eyebrow">수호자님, 어서 오세요</div>
        <p className="ob__msg">아래 순서대로 따라오시면 됩니다.</p>

        <ol className="ob__steps">
          {STEPS.map(([title, desc], i) => (
            <li key={title}>
              <span className="ob__no">{i + 1}</span>
              <span className="ob__text">
                <b>{title}</b>
                <i>{desc}</i>
              </span>
            </li>
          ))}
        </ol>

        <button type="button" className="btn" onClick={onStart}>프롤로그 영상 보기</button>
      </div>
    </div>
  );
}
