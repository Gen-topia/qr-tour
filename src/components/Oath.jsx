'use client';

// 수호자 서약 — 소셜 로그인 전에 한 번만 거치는 선언문.
// 시안(성혼선언문)처럼 얇은 테두리를 두른 종이 위에 글을 가운데로 앉힌다.

const OATH = `본인은 비밀 파수꾼
‘동자석’의 령을 대리하고,
이곳 제주의 수호자로서,
측간신의 어둠으로부터 오염된
현세의 유산을 정화하고 회복시켜
닫혀버린 하늘 문을 다시 열어낼
최종 과업을 완수하는 데에
성실히 임할 것을 서약합니다.`;

const ASK = `설문대할망의 사자,
비밀 파수꾼 ‘동자석’과의
수호자 서약을 진행하시겠습니까?`;

export default function Oath({ onAgree, onBack }) {
  return (
    <div className="onboard sheet oath">
      <div className="sheet__panel oath__panel">
        <div className="oath__toolbar">
          <button type="button" className="gd__back" onClick={onBack} aria-label="뒤로">
            <svg viewBox="0 0 34 20" aria-hidden="true">
              <path d="M10.5 2 2 10l8.5 8M2 10h31" fill="none" stroke="currentColor"
                    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="oath__frame">
          <h1 className="oath__title">수호자 서약</h1>
          <p className="oath__body">{OATH}</p>
          <p className="oath__ask">{ASK}</p>
        </div>

        <button type="button" className="btn oath__cta" onClick={onAgree}>서약하기</button>
      </div>
    </div>
  );
}
