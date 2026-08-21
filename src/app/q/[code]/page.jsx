'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authClient';
import { api } from '@/lib/apiClient';
import Loading from '@/components/Loading';
import InfoModal from '@/components/InfoModal';

// QR로 들어오는 입구.
//  1) 로그인했는지 확인한다(안 했으면 로그인 화면으로 안내)
//  2) 진행해도 되는지 확인한다(오픈 전이면 테스터만 통과)
//  3) 통과하면 해당 미션으로 보낸다
export default function QrEntry() {
  const { code } = useParams();
  const router = useRouter();
  const { isAuthed, ready } = useAuth();

  const [gate, setGate] = useState('checking');   // checking | closed | login | go
  const [msg, setMsg] = useState('퀘스트를 확인하는 중…');
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState('');       // 선행 퀘스트를 못 깬 경우의 안내 문구

  // 1) 로그인부터 확인한다 — 오픈 전이라도 테스터인지 보려면 누구인지 알아야 한다
  useEffect(() => {
    if (!ready) return;
    if (!isAuthed) { setGate('login'); return; }
    let alive = true;
    api.myAccess()
      .then(r => { if (alive) setGate(r.allowed ? 'go' : 'closed'); })
      .catch(() => { if (alive) setGate('go'); })   // 판정에 실패하면 막지 않는다
    return () => { alive = false; };
  }, [ready, isAuthed]);

  // 2) 미션으로 보낸다
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

  // 오픈 전이고 테스터도 아니면 더 진행하지 않는다
  if (gate === 'closed') return (
    <>
      <Loading label="퀘스트를 확인하는 중…" />
      <InfoModal eyebrow="안내" title="이용할 수 있는 기간이 아닙니다"
                 confirmLabel="확인" onClose={() => router.replace('/')}>
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
