'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';
import { STEP_TYPES } from '@/lib/stepTypes';
import { SPOT_OPTIONS } from '@/lib/spots';
import { QUEST_GROUPS } from '@/lib/questGroups';

const EMPTY = { title: '', order_no: 1, quest_group: 1, place: '', cover_image_url: '', reward_points: 100, is_active: 1 };
const SAMPLE = JSON.stringify([STEP_TYPES.story.sample, STEP_TYPES.quiz.sample], null, 2);

function Quests() {
  const [quests, setQuests] = useState([]);
  const [editing, setEditing] = useState(null);
  const [stepsText, setStepsText] = useState('');
  const [stepsErr, setStepsErr] = useState('');
  const [newType, setNewType] = useState('quiz');

  async function load() { setQuests((await api.adminQuests()).quests); }
  useEffect(() => { load(); }, []);

  async function openEdit(qst) {
    setEditing(qst); setStepsErr('');
    if (qst.id) {
      const { steps } = await api.adminGetSteps(qst.id);
      // 값이 없는 필드는 빼서 JSON을 읽기 쉽게 유지한다
      setStepsText(JSON.stringify(steps.map(s => {
        const out = { type: s.type };
        for (const k of ['title', 'body_text', 'image_url', 'audio_url', 'hint_text', 'question', 'answer', 'config']) {
          if (s[k] !== null && s[k] !== undefined && s[k] !== '') out[k] = s[k];
        }
        return out;
      }), null, 2));
    } else setStepsText(SAMPLE);
  }

  // 선택한 유형의 기본값 스텝을 JSON 배열 끝에 추가한다
  function addStep() {
    let steps;
    try { steps = JSON.parse(stepsText); if (!Array.isArray(steps)) throw 0; }
    catch { setStepsErr('현재 JSON이 올바르지 않아 추가할 수 없습니다.'); return; }
    steps.push(STEP_TYPES[newType].sample);
    setStepsText(JSON.stringify(steps, null, 2));
    setStepsErr('');
  }

  // 마지막 스텝의 유형을 바꾸고 그 유형의 기본값으로 교체한다
  function changeLastType(type) {
    setNewType(type);
    let steps;
    try { steps = JSON.parse(stepsText); if (!Array.isArray(steps) || !steps.length) return; }
    catch { return; }
    const last = steps[steps.length - 1];
    // 공통 필드는 남기고 유형별 필드는 기본값으로 갈아끼운다
    steps[steps.length - 1] = {
      ...STEP_TYPES[type].sample,
      ...(last.title ? { title: last.title } : {}),
      ...(last.body_text ? { body_text: last.body_text } : {}),
      ...(last.image_url ? { image_url: last.image_url } : {}),
      ...(last.hint_text ? { hint_text: last.hint_text } : {}),
      type,
    };
    setStepsText(JSON.stringify(steps, null, 2));
    setStepsErr('');
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
        <thead><tr><th>순서</th><th>구분</th><th>제목</th><th>유형</th><th>코드(QR)</th><th>포인트</th><th>활성</th><th></th></tr></thead>
        <tbody>
          {quests.map(q => (
            <tr key={q.id}><td>{q.order_no}</td>
              <td>{QUEST_GROUPS.find(g => g.value === q.quest_group)?.label || '—'}</td>
              <td>{q.title}</td>
              <td>
                {q.step_types?.length
                  ? <span className="type-tags">
                      {q.step_types.map(t => (
                        <span key={t} className="badge">{STEP_TYPES[t]?.label || t}</span>
                      ))}
                    </span>
                  : <span className="muted">—</span>}
              </td>
              <td><code>{q.code}</code></td>
              <td>{q.reward_points}</td><td>{q.is_active ? 'Y' : 'N'}</td>
              <td className="row-actions"><button className="btn sm ghost" onClick={() => openEdit(q)}>수정</button>
                <button className="btn sm danger" onClick={() => remove(q.id)}>삭제</button></td></tr>
          ))}
          {quests.length === 0 && <tr><td colSpan="8" className="muted">등록된 미션이 없습니다.</td></tr>}
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
              <div className="field">
                <label>퀘스트 구분</label>
                <select className="input" value={editing.quest_group ?? 1} onChange={e => setEditing({ ...editing, quest_group: +e.target.value })}>
                  {QUEST_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>장소 (코드 지도)</label>
                <select className="input" value={editing.place || ''} onChange={e => setEditing({ ...editing, place: e.target.value })}>
                  <option value="">— 지정 안 함 —</option>
                  {SPOT_OPTIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid2">
              <div className="field"><label>보상 포인트</label><input className="input" type="number" value={editing.reward_points} onChange={e => setEditing({ ...editing, reward_points: +e.target.value })} /></div>
            </div>
            <div className="field"><label>커버 이미지 URL</label><input className="input" value={editing.cover_image_url || ''} onChange={e => setEditing({ ...editing, cover_image_url: e.target.value })} /></div>
            <div className="field">
              <label>서브페이지 (JSON)</label>
              <div className="spread" style={{ marginBottom: 8 }}>
                <select className="input" style={{ flex: 1 }} value={newType}
                  onChange={e => changeLastType(e.target.value)}>
                  {Object.entries(STEP_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button type="button" className="btn sm ghost" onClick={addStep}>+ 스텝 추가</button>
              </div>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>{STEP_TYPES[newType].hint}</p>
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
