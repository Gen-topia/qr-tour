'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

const EMPTY = { title: '', order_no: 1, cover_image_url: '', reward_points: 100, is_active: 1 };
const SAMPLE = `[
  { "type": "story", "title": "1장", "body_text": "이야기 도입..." },
  { "type": "quiz", "title": "미션", "question": "정답이 뭘까요?",
    "options": ["보기1","보기2","정답"], "answer": "정답" }
]`;

function Quests() {
  const [quests, setQuests] = useState([]);
  const [editing, setEditing] = useState(null);
  const [stepsText, setStepsText] = useState('');
  const [stepsErr, setStepsErr] = useState('');

  async function load() { setQuests((await api.adminQuests()).quests); }
  useEffect(() => { load(); }, []);

  async function openEdit(qst) {
    setEditing(qst); setStepsErr('');
    if (qst.id) {
      const { steps } = await api.adminGetSteps(qst.id);
      setStepsText(JSON.stringify(steps.map(s => ({
        type: s.type, title: s.title, body_text: s.body_text, image_url: s.image_url,
        audio_url: s.audio_url, hint_text: s.hint_text, question: s.question, options: s.options, answer: s.answer,
      })), null, 2));
    } else setStepsText(SAMPLE);
  }
  async function save() {
    let steps;
    try { steps = JSON.parse(stepsText); if (!Array.isArray(steps)) throw 0; }
    catch { setStepsErr('서브페이지 JSON 형식이 올바르지 않습니다.'); return; }
    let id = editing.id;
    if (id) await api.adminUpdateQuest(id, editing); else id = (await api.adminCreateQuest(editing)).id;
    await api.adminPutSteps(id, steps);
    setEditing(null); load();
  }
  async function remove(id) { if (confirm('삭제할까요?')) { await api.adminDeleteQuest(id); load(); } }

  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>미션 관리</h1>
        <button className="btn sm" onClick={() => openEdit({ ...EMPTY, order_no: quests.length + 1 })}>+ 새 미션</button>
      </div>
      <table className="table">
        <thead><tr><th>순서</th><th>제목</th><th>코드(QR)</th><th>포인트</th><th>활성</th><th></th></tr></thead>
        <tbody>
          {quests.map(q => (
            <tr key={q.id}><td>{q.order_no}</td><td>{q.title}</td><td><code>{q.code}</code></td>
              <td>{q.reward_points}</td><td>{q.is_active ? 'Y' : 'N'}</td>
              <td className="row-actions"><button className="btn sm ghost" onClick={() => openEdit(q)}>수정</button>
                <button className="btn sm danger" onClick={() => remove(q.id)}>삭제</button></td></tr>
          ))}
          {quests.length === 0 && <tr><td colSpan="6" className="muted">등록된 미션이 없습니다.</td></tr>}
        </tbody>
      </table>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,26,46,.35)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 50 }} onClick={() => setEditing(null)}>
          <div className="card" style={{ width: 620, maxHeight: '88vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h1 style={{ marginTop: 0, fontSize: 20 }}>{editing.id ? '미션 수정' : '새 미션'}</h1>
            <div className="grid2">
              <div className="field"><label>제목</label><input className="input" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="field"><label>순서</label><input className="input" type="number" value={editing.order_no} onChange={e => setEditing({ ...editing, order_no: +e.target.value })} /></div>
            </div>
            <div className="grid2">
              <div className="field"><label>커버 이미지 URL</label><input className="input" value={editing.cover_image_url || ''} onChange={e => setEditing({ ...editing, cover_image_url: e.target.value })} /></div>
              <div className="field"><label>보상 포인트</label><input className="input" type="number" value={editing.reward_points} onChange={e => setEditing({ ...editing, reward_points: +e.target.value })} /></div>
            </div>
            <div className="field"><label>서브페이지 (JSON) — type: story / quiz / photo</label>
              <textarea style={{ minHeight: 220, fontFamily: 'monospace', fontSize: 13 }} value={stepsText} onChange={e => setStepsText(e.target.value)} />
              {stepsErr && <p style={{ color: 'var(--talisman)', fontSize: 13 }}>{stepsErr}</p>}
            </div>
            <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn sm ghost" onClick={() => setEditing(null)}>취소</button>
              <button className="btn sm" onClick={save}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function Page() { return <AdminShell><Quests /></AdminShell>; }
