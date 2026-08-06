'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { to: '/',         label: '홈',      icon: '🏮' },
  { to: '/scan',     label: '스캔',    icon: '📷' },
  { to: '/missions', label: '나의미션', icon: '📜' },
];
const IMMERSIVE = [/^\/quest\//, /^\/scan/];

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
          {TABS.map(t => {
            const on = t.to === '/' ? pathname === '/' : pathname.startsWith(t.to);
            return (
              <Link key={t.to} href={t.to} className={'tab' + (on ? ' tab--on' : '')}>
                <span className="tab__icon">{t.icon}</span>
                <span className="tab__label">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
