// 시안의 8방 별표(✳) — 지침서·미션 화면이 함께 쓴다
export default function Sparkle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 1.5V22.5M1.5 12H22.5" />
        <path d="M4.9 4.9 19.1 19.1M19.1 4.9 4.9 19.1" strokeWidth="1.1" />
      </g>
    </svg>
  );
}
