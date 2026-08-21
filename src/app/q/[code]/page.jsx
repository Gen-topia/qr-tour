'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authClient';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';
import InfoModal from '@/components/InfoModal';

// QR로 들어오는 입구.
//  1) 앱이 열려 있는지 확인한다(닫혀 있으면 여기서 끝)
//  2) 로그인했는지 확인한다(안 했으면 로그인 화면으로 안내)
//  3) 둘 다 통과하면 해당 미션으로 보낸다
export default function QrEntry() {
  const { code } = useParams();
  const router = useRouter();
  const { isAuthed, ready } = useAuth();

  const [gate, setGate] = useState('checking');   // checking | closed | login | go
  const [msg, setMsg] = useState('퀘스트를 확인하는 중…');
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState('');       // 선행 퀘스트를 못 깬 경우의 안내 문구

  // 1) 오픈 여부는 로그인 전에도 확인해야 한다
  useEffect(() => {
    let alive = true;
    api.settings()
      .then(r => { if (alive) setGate(r.questOpen ? 'open' : 'closed'); })
      .catch(() => { if (alive) setGate('open'); })   // 확인에 실패하면 막지 않는다
    return () => { alive = false; };
  }, []);

  // 2) 열려 있으면 로그인 상태를 본다
  useEffect(() => {
    if (gate !== 'open' || !ready) return;
    setGate(isAuthed ? 'go' : 'login');
  }, [gate, ready, isAuthed]);

  // 3) 미션으로 보낸다
  useEffect(() => {
    if (gate !== 'go') return;
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
  }, [gate, code, router]);

  // 운영 기간이 아니면 더 진행하지 않고 창을 닫는다
  if (gate === 'closed') return (
    <>
      <Loading label="퀘스트를 확인하는 중…" />
      <InfoModal eyebrow="안내" title="이용 가능한 기간이 아닙니다"
                 confirmLabel="확인" onClose={() => window.close()}>
        지금은 퀘스트를 진행할 수 있는 기간이 아니에요.{'\n'}운영 기간에 다시 찾아와 주세요.
      </InfoModal>
    </>
  );

  if (gate === 'login') return (
    <>
      <Loading label="퀘스트를 확인하는 중…" />
      <InfoModal eyebrow="안내" title="로그인이 필요해요"
                 confirmLabel="확인"
                 onClose={() => router.replace(`/?next=${encodeURIComponent(`/q/${code}`)}`)}>
        퀘스트를 진행하려면 로그인을 해주세요.
      </InfoModal>
    </>
  );

  if (locked) return (
    <>
      <Loading label="퀘스트를 확인하는 중…" />
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
