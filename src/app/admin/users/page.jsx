'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

function Users() {
  const [users, setUsers] = useState([]);
  const [quests, setQuests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [seeing, setSeeing] = useState(null);   // 정보 보기로 펼쳐 둔 참가자
  useEffect(() => {
    api.adminUsers().then(d => { setUsers(d.users); setQuests(d.quests || []); }).catch(() => {});
  }, []);

  // 엑셀 파일은 서버가 만들어 보내준다(/api/admin/users/export)
  async function download() {
    setBusy(true);
    try {
      const blob = await api.adminUsersXlsx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `참가자_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>사용자 모니터링</h1>
        <button className="btn sm" disabled={busy || users.length === 0} onClick={download}>
          {busy ? '만드는 중…' : `엑셀 내려받기 (${users.length}명)`}
        </button>
      </div>
      <table className="table">
        <thead><tr><th>ID</th><th>UUID</th><th>닉네임</th><th>이메일</th><th>전화번호</th><th>누적점수</th><th>완료 미션</th><th>가입일</th><th></th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}><td>{u.id}</td><td><code style={{ fontSize: 12 }}>{u.uuid}</code></td>
              <td>{u.nickname || '-'}</td><td>{u.email || '-'}</td><td>{u.phone || '-'}</td>
              <td>{u.total_points}</td><td>{u.cleared_count}/{quests.length}</td>
              <td className="muted">{String(u.created_at).slice(0, 10)}</td>
              <td className="row-actions">
                <button className="btn sm ghost" onClick={() => setSeeing(u)}>정보 보기</button>
              </td></tr>
          ))}
          {users.length === 0 && <tr><td colSpan="9" className="muted">참가자가 없습니다.</td></tr>}
        </tbody>
      </table>

      {/* 한 참가자가 어느 미션을 깼는지 — 사전 퀘스트부터 순서대로 */}
      {seeing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,26,46,.35)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 50 }} onClick={() => setSeeing(null)}>
          <div className="card" style={{ width: 600, maxHeight: '88vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h1 style={{ marginTop: 0, fontSize: 20 }}>{seeing.nickname || '(닉네임 없음)'}</h1>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
              ID {seeing.id} · {seeing.email || '이메일 없음'} · {seeing.phone || '전화번호 없음'}
              <br />누적 {seeing.total_points}점 · {Object.keys(seeing.cleared).length}/{quests.length} 완수
            </p>
            <table className="table">
              <thead><tr><th style={{ width: 60 }}>수행</th><th>퀘스트</th><th style={{ width: 130 }}>완료 시각</th></tr></thead>
              <tbody>
                {quests.map(qz => {
                  const at = seeing.cleared[qz.id];        // 깼으면 '2026-08-25 10:20', 아니면 없음
                  const done = at !== undefined;
                  return (
                    <tr key={qz.id}>
                      <td style={{ fontWeight: 700, color: done ? 'var(--lantern-dim)' : 'var(--text-dim)' }}>
                        {done ? 'O' : 'X'}
                      </td>
                      <td>{qz.title}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{at || '-'}</td>
                    </tr>
                  );
                })}
                {quests.length === 0 && <tr><td colSpan="3" className="muted">미션이 없습니다.</td></tr>}
              </tbody>
            </table>
            <button className="btn sm ghost" style={{ marginTop: 14 }} onClick={() => setSeeing(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function Page() { return <AdminShell><Users /></AdminShell>; }
