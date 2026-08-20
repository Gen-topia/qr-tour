'use client';
import Link from 'next/link';
import Sparkle from '@/components/Sparkle';

// 시트 화면(수호자 지침서·나의 퀘스트) 아래에 고정으로 뜨는 남색 탭바.
// onHome이 있으면 '메인으로'를 버튼으로, 없으면 링크로 둔다.
export default function SheetNav({ onHome }) {
  return (
    <nav className="gd__nav">
      {onHome ? (
        <button type="button" className="gd__tab" onClick={onHome}>
          <HomeIcon /><span>메인으로</span>
        </button>
      ) : (
        <Link className="gd__tab" href="/">
          <HomeIcon /><span>메인으로</span>
        </Link>
      )}
      <Link className="gd__tab" href="/missions">
        <Sparkle />
        <span>퀘스트</span>
      </Link>
      <Link className="gd__tab" href="/map">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
             strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="12" cy="13" r="7.5" />
          <path d="M15 10l-1.7 4.3-4.3 1.7 1.7-4.3z" />
          <path d="M10.6 4.2h2.8" strokeWidth="1" />
        </svg>
        <span>코드지도</span>
      </Link>
      <Link className="gd__tab" href="/scan">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
             strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M3 8V4.6A1.6 1.6 0 0 1 4.6 3H8M16 3h3.4A1.6 1.6 0 0 1 21 4.6V8M21 16v3.4a1.6 1.6 0 0 1-1.6 1.6H16M8 21H4.6A1.6 1.6 0 0 1 3 19.4V16" />
          <rect x="7.5" y="7.5" width="9" height="9" rx="1.6" />
        </svg>
        <span>코드탐색</span>
      </Link>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
         strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3.2 10.4 12 3l8.8 7.4V21H3.2z" />
      <path d="M9 21v-5.2a3 3 0 0 1 6 0V21" />
    </svg>
  );
}
