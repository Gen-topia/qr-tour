'use client';

// 프롤로그·지침서처럼 읽기만 하는 안내 모달
export default function InfoModal({ eyebrow, title, onClose, confirmLabel = '닫기', children }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="card stack modal__panel" onClick={e => e.stopPropagation()}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {title && <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>}
        <div className="modal__body">{children}</div>
        <button className="btn" onClick={onClose}>{confirmLabel}</button>
      </div>
    </div>
  );
}
