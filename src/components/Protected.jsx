'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authClient';

// 로그인(uuid) 안됐으면 메인으로 보내되 next로 복귀 지점 보존
export default function Protected({ children }) {
  const { isAuthed, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !isAuthed) router.replace(`/?next=${encodeURIComponent(pathname)}`);
  }, [ready, isAuthed, pathname, router]);

  if (!ready || !isAuthed) return <div className="screen center"><div className="lantern" /></div>;
  return children;
}
