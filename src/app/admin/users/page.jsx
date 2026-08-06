'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.adminUsers().then(d => setUsers(d.users)).catch(() => {}); }, []);
  return (
    <div>
      <h1>사용자 모니터링</h1>
      <table className="table">
        <thead><tr><th>ID</th><th>UUID</th><th>닉네임</th><th>누적점수</th><th>완료 미션</th><th>가입일</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}><td>{u.id}</td><td><code style={{ fontSize: 12 }}>{u.uuid}</code></td>
              <td>{u.nickname || '-'}</td><td>{u.total_points}</td><td>{u.cleared_count}</td>
              <td className="muted">{String(u.created_at).slice(0, 10)}</td></tr>
          ))}
          {users.length === 0 && <tr><td colSpan="6" className="muted">참가자가 없습니다.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
export default function Page() { return <AdminShell><Users /></AdminShell>; }
