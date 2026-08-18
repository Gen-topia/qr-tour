'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 하단 탭바를 쓰지 않는 화면
// — 메인은 중앙 메뉴로 이동하고, 나머지는 화면 안에 '메인으로' 버튼을 두고 있다
// /q/{code}는 미션으로 넘겨주기만 하는 경유 화면 — 탭바가 잠깐 떴다 사라지지 않게 함께 뺀다
const IMMERSIVE = [/^\/$/, /^\/q\//, /^\/quest\//, /^\/scan/, /^\/missions/, /^\/map/];

export default function AppShell({ children }) {
  const pathname = usePathname() || '/';
  // 관리자(PC)는 자체 레이아웃 → 모바일 프레임 미적용
  if (pathname.startsWith('/admin')) return <>{children}</>;

  const immersive = IMMERSIVE.some(re => re.test(pathname));
  return (
    <div className="frame">
      <div className="frame__body">{children}</div>
      {!immersive && (
        <nav className="tabbar">
          <Link href="/" className="tab">
            <span className="tab__icon">🏮</span>
            <span className="tab__label">메인으로</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
