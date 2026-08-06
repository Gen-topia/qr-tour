'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';

export default function AdminLogin() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  async function submit() {
    try { const { token } = await api.adminLogin(username, password); localStorage.setItem('admin_token', token); router.push('/admin/quests'); }
    catch (e) { setErr(e.message); }
  }
  return (
    <div className="admin__login">
      <div className="card stack">
        <div className="eyebrow">관리자</div>
        <h1 style={{ margin: 0 }}>콘텐츠 관리 로그인</h1>
        <div className="field"><label>아이디</label><input className="input" value={username} onChange={e => setU(e.target.value)} /></div>
        <div className="field"><label>비밀번호</label><input className="input" type="password" value={password} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        {err && <p style={{ color: 'var(--talisman)', fontSize: 14 }}>{err}</p>}
        <button className="btn" onClick={submit}>로그인</button>
      </div>
    </div>
  );
}
