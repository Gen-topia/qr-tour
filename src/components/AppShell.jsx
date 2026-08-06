'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authClient';

const TABS = [
  { to: '/',         label: '홈',      icon: '🏮' },
  { to: '/scan',     label: '스캔',    icon: '📷', auth: true },
  { to: '/missions', label: '나의미션', icon: '📜', auth: true },
];
const IMMERSIVE = [/^\/quest\//, /^\/scan/];

export default function AppShell({ children }) {
  const pathname = usePathname() || '/';
  const { isAuthed, ready } = useAuth();
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
            const inner = (<>
              <span className="tab__icon">{t.icon}</span>
              <span className="tab__label">{t.label}</span>
            </>);
            // 로그인 전에는 이동 자체를 막고 안내만 띄운다
            if (t.auth && ready && !isAuthed) {
              return (
                <button key={t.to} type="button" className="tab"
                  onClick={() => alert('메뉴를 이용하려면 로그인해주세요.')}>
                  {inner}
                </button>
              );
            }
            return (
              <Link key={t.to} href={t.to} className={'tab' + (on ? ' tab--on' : '')}>
                {inner}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
