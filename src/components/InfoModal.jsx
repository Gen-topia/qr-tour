'use client';

// 프롤로그·지침서처럼 읽기만 하는 안내 모달.
// onClose를 주지 않으면 덮개를 눌러도, 단추로도 닫히지 않는다(여정의 끝 안내 등).
export default function InfoModal({ eyebrow, title, onClose, confirmLabel = '닫기', children }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="card stack modal__panel" onClick={e => e.stopPropagation()}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {title && <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>}
        <div className="modal__body">{children}</div>
        {onClose && <button className="btn" onClick={onClose}>{confirmLabel}</button>}
      </div>
    </div>
  );
}
