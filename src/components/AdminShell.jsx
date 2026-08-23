'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) router.replace('/admin');
    else setOk(true);
  }, [router]);
  if (!ok) return null;
  const item = (href, label) => (
    <Link href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
  );
  return (
    <div className="admin">
      <nav className="admin__nav">
        <div className="admin__brand">🏮 투어 관리</div>
        {item('/admin/quests', '미션 관리')}
        {item('/admin/qr', 'QR 코드')}
        {item('/admin/map', '코드 지도')}
        {item('/admin/users', '사용자 모니터링')}
        <div style={{ flex: 1 }} />
        <a style={{ cursor: 'pointer' }} onClick={() => { localStorage.removeItem('admin_token'); router.replace('/admin'); }}>로그아웃</a>
      </nav>
      <main className="admin__main">{children}</main>
    </div>
  );
}
