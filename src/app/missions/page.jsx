'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import ProgressBar from '@/components/ProgressBar';
import Loading from '@/components/Loading';

function Missions() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const router = useRouter();
  useEffect(() => { api.myMissions().then(setData).catch(e => setErr(e.message)); }, []);
  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!data) return <Loading label="미션을 불러오는 중…" />;
  return (
    <div className="screen stack fade-in">
      <div className="spread">
        <div><div className="eyebrow">나의 미션</div><h1 style={{ margin: 0 }}>{data.user?.nickname || '참가자'}</h1></div>
        <div className="center"><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--lantern)' }}>{data.totalPoints}</div><div className="muted" style={{ fontSize: 12 }}>점</div></div>
      </div>
      <ProgressBar done={data.progress.done} total={data.progress.total} />
      <div className="stack" style={{ marginTop: 8 }}>
        {data.quests.map(q => (
          <div key={q.id} className="card spread">
            <div><div className="muted" style={{ fontSize: 12 }}>미션 {q.order_no}</div><div style={{ fontWeight: 700 }}>{q.title}</div></div>
            <span className={`badge ${q.cleared ? 'done' : ''}`}>{q.cleared ? '완료' : '미완료'}</span>
          </div>
        ))}
        {data.quests.length === 0 && <p className="muted">아직 미션이 없어요.</p>}
      </div>
      <div className="grow" />
      {/* <button className="btn" onClick={() => router.push('/scan')}>QR 스캔하기</button> */}
    </div>
  );
}
export default function Page() { return <Protected><Missions /></Protected>; }
