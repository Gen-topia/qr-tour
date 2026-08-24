'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

function Users() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.adminUsers().then(d => setUsers(d.users)).catch(() => {}); }, []);

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
        <thead><tr><th>ID</th><th>UUID</th><th>닉네임</th><th>이메일</th><th>전화번호</th><th>누적점수</th><th>완료 미션</th><th>가입일</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}><td>{u.id}</td><td><code style={{ fontSize: 12 }}>{u.uuid}</code></td>
              <td>{u.nickname || '-'}</td><td>{u.email || '-'}</td><td>{u.phone || '-'}</td>
              <td>{u.total_points}</td><td>{u.cleared_count}</td>
              <td className="muted">{String(u.created_at).slice(0, 10)}</td></tr>
          ))}
          {users.length === 0 && <tr><td colSpan="6" className="muted">참가자가 없습니다.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
export default function Page() { return <AdminShell><Users /></AdminShell>; }
