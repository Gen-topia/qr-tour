'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';

function QrEntry() {
  const { code } = useParams();
  const router = useRouter();
  const [msg, setMsg] = useState('미션을 확인하는 중…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { quest } = await api.questByCode(code);
        if (!alive) return;
        // 미션 상세는 /quest 에서 다시 조회 (새로고침에도 안전)
        router.replace(`/quest/${quest.id}`);
      } catch (e) { if (alive) { setFailed(true); setMsg(e.message || '잘못된 코드입니다.'); } }
    })();
    return () => { alive = false; };
  }, [code, router]);

  if (!failed) return <Loading label={msg} />;
  return (
    <div className="screen center">
      <div className="grow" /><div className="lantern" /><p className="muted">{msg}</p><div className="grow" />
      <button className="btn" onClick={() => router.replace('/')}>메인으로</button>
    </div>
  );
}
export default function Page() { return <Protected><QrEntry /></Protected>; }
