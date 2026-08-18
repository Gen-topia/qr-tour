'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';
import InfoModal from '@/components/InfoModal';

function QrEntry() {
  const { code } = useParams();
  const router = useRouter();
  const [msg, setMsg] = useState('미션을 확인하는 중…');
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState('');   // 선행 퀘스트를 못 깬 경우의 안내 문구

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { quest, locked } = await api.questByCode(code);
        if (!alive) return;
        if (locked) { setLocked(locked); return; }
        // 미션 상세는 /quest 에서 다시 조회 (새로고침에도 안전)
        router.replace(`/quest/${quest.id}`);
      } catch (e) { if (alive) { setFailed(true); setMsg(e.message || '잘못된 코드입니다.'); } }
    })();
    return () => { alive = false; };
  }, [code, router]);

  if (locked) return (
    <>
      <Loading label="미션을 확인하는 중…" />
      <InfoModal eyebrow="아직 도전할 수 없어요" title="선행 퀘스트를 먼저 완수해 주세요"
                 confirmLabel="확인" onClose={() => router.replace('/')}>
        {locked}
      </InfoModal>
    </>
  );
  if (!failed) return <Loading label={msg} />;
  return (
    <div className="screen center">
      <div className="grow" /><div className="lantern" /><p className="muted">{msg}</p><div className="grow" />
      <button className="btn" onClick={() => router.replace('/')}>메인으로</button>
    </div>
  );
}
export default function Page() { return <Protected><QrEntry /></Protected>; }
