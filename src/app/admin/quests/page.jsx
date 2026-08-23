'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';
import { STEP_TYPES } from '@/lib/stepTypes';
import { SPOT_OPTIONS } from '@/lib/spots';
import { QUEST_GROUPS } from '@/lib/questGroups';

const EMPTY = { title: '', header_title: '', order_no: 1, quest_group: 1, main_no: 1, main_title: '', place: '', cover_image_url: '', clear_image_url: '', narration_video: '', clear_text: '', clear_audio_url: '', reward_points: 100, is_active: 1 };
const SAMPLE = JSON.stringify([STEP_TYPES.story.sample, STEP_TYPES.quiz.sample], null, 2);

function Quests() {
  const [quests, setQuests] = useState([]);
  const [open, setOpen] = useState(null);   // 앱 오픈 여부(null이면 확인 중)
  const [testers, setTesters] = useState([]);   // 오픈 전에도 쓸 수 있는 이메일
  const [tEmail, setTEmail] = useState('');
  const [tNote, setTNote] = useState('');
  const [editing, setEditing] = useState(null);
  const [stepsText, setStepsText] = useState('');
  const [stepsErr, setStepsErr] = useState('');
  const [newType, setNewType] = useState('quiz');

  async function load() { setQuests((await api.adminQuests()).quests); }
  useEffect(() => { load(); }, []);
  useEffect(() => { api.adminSettings().then(r => setOpen(r.questOpen)).catch(() => {}); }, []);
  useEffect(() => { loadTesters(); }, []);
  function loadTesters() { api.adminTesters().then(r => setTesters(r.testers)).catch(() => {}); }

  async function openEdit(qst) {
    setEditing(qst); setStepsErr('');
    if (qst.id) {
      const { steps } = await api.adminGetSteps(qst.id);
      // 값이 없는 필드는 빼서 JSON을 읽기 쉽게 유지한다
      setStepsText(JSON.stringify(steps.map(s => {
        const out = { type: s.type };
        for (const k of ['title', 'body_text', 'image_url', 'audio_url', 'hint_text', 'hint_image_url', 'question', 'answer', 'config']) {
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
      ...(last.hint_image_url ? { hint_image_url: last.hint_image_url } : {}),
      // 목록 이름과 실제 저장 유형이 다를 수 있다(예: 4지선다 → quiz)
      type: STEP_TYPES[type].sample.type || type,
    };
    setStepsText(JSON.stringify(steps, null, 2));
    setStepsErr('');
  }
  async function save() {
    let steps;
    try { steps = JSON.parse(stepsText); if (!Array.isArray(steps)) throw 0; }
    catch { setStepsErr('서브페이지 JSON 형식이 올바르지 않습니다.'); return; }
    let id = editing.id;
    // QR 코드가 겹치면 서버가 막는다 — 무엇이 잘못됐는지 알려준다
    try {
      if (id) await api.adminUpdateQuest(id, editing); else id = (await api.adminCreateQuest(editing)).id;
    } catch (e) { alert(e.message); return; }
    await api.adminPutSteps(id, steps);
    setEditing(null); load();
  }
  async function addTester() {
    try { await api.adminAddTester(tEmail, tNote); setTEmail(''); setTNote(''); loadTesters(); }
    catch (e) { alert(e.message); }
  }
  async function delTester(email) {
    if (!confirm(`${email} 을(를) 목록에서 뺄까요?`)) return;
    try { await api.adminDelTester(email); loadTesters(); }
    catch (e) { alert(e.message); }
  }
  async function toggleOpen() {
    try { const r = await api.adminSetOpen(!open); setOpen(r.questOpen); }
    catch (e) { alert(e.message); }
  }
  async function remove(id) { if (confirm('삭제할까요?')) { await api.adminDeleteQuest(id); load(); } }

  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>미션 관리</h1>
        <button className="btn sm" onClick={() => openEdit({ ...EMPTY, order_no: quests.length + 1 })}>+ 새 미션</button>
      </div>

      {/* 앱 전체 오픈 스위치 — 끄면 QR로 들어와도 '이용 가능한 기간이 아닙니다'가 뜬다 */}
      <div className="card spread" style={{ marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700 }}>퀘스트 오픈</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {open === null ? '확인하는 중…'
              : open ? '참가자가 QR로 퀘스트를 진행할 수 있습니다.'
                     : '참가자에게 «이용 가능한 기간이 아닙니다» 안내가 나갑니다.'}
          </div>
        </div>
        <button className={`btn sm${open ? '' : ' ghost'}`} disabled={open === null}
                onClick={toggleOpen}>{open ? '오픈 (1)' : '마감 (0)'}</button>
      </div>

      {/* 마감(0)이어도 여기 등록한 이메일로 로그인하면 그대로 진행할 수 있다 */}
      <div className="card stack" style={{ marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700 }}>테스터 이메일</div>
          <div className="muted" style={{ fontSize: 13 }}>
            마감 상태에서도 이 이메일로 카카오·네이버 로그인하면 퀘스트를 진행할 수 있습니다.
          </div>
        </div>
        <div className="grid2">
          <div className="field" style={{ margin: 0 }}>
            <input className="input" placeholder="tester@example.com" value={tEmail}
                   onChange={e => setTEmail(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addTester()} />
          </div>
          <div className="field" style={{ margin: 0, display: 'flex', gap: 8 }}>
            <input className="input" placeholder="메모(선택)" value={tNote}
                   onChange={e => setTNote(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addTester()} />
            <button className="btn sm" onClick={addTester}>추가</button>
          </div>
        </div>
        {testers.length > 0 && (
          <table className="table">
            <thead><tr><th>이메일</th><th>메모</th><th></th></tr></thead>
            <tbody>
              {testers.map(t => (
                <tr key={t.email}>
                  <td>{t.email}</td>
                  <td>{t.note || '—'}</td>
                  <td><button className="btn sm ghost" onClick={() => delTester(t.email)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {testers.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 13 }}>등록된 이메일이 없습니다.</p>}
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
            {/* QR 코드는 곧 접속 주소다. 고치면 이미 인쇄한 QR은 이 퀘스트를 열지 못한다 */}
            <div className="field">
              <label>QR 코드</label>
              <input className="input" style={{ fontFamily: 'monospace' }}
                value={editing.code || ''} placeholder={editing.id ? '' : '비워두면 자동으로 만듭니다'}
                onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
              <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
                접속 주소 <code>/q/{editing.code || '(자동)'}</code>
                {editing.id && ' — 코드를 바꾸면 이미 인쇄한 QR로는 이 미션이 열리지 않습니다.'}
              </p>
            </div>
            <div className="grid2">
              <div className="field"><label>제목</label><input className="input" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="'나의 퀘스트' 목록에 보이는 이름" /></div>
              <div className="field"><label>진행 화면 윗줄</label><input className="input" value={editing.header_title || ''} onChange={e => setEditing({ ...editing, header_title: e.target.value })} placeholder="비우면 제목을 그대로 쓴다" /></div>
              <div className="field"><label>순서</label><input className="input" type="number" value={editing.order_no} onChange={e => setEditing({ ...editing, order_no: +e.target.value })} /></div>
            </div>
            {/* 이 미션(QR)이 어느 메인 퀘스트에 속하는지 — 같은 번호끼리 모두 깨야 한 퀘스트가 완수된다 */}
            <div className="grid2">
              <div className="field"><label>메인 퀘스트 번호</label><input className="input" type="number" min="1" value={editing.main_no ?? 1} onChange={e => setEditing({ ...editing, main_no: +e.target.value })} /></div>
              <div className="field"><label>메인 퀘스트 이름</label><input className="input" value={editing.main_title || ''} onChange={e => setEditing({ ...editing, main_title: e.target.value })} placeholder="예: 용천수(수기)" /></div>
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
            <div className="field">
              <label>첫 페이지 이미지 URL</label>
              <input className="input" placeholder="예: /quest_intro_5.png (비우면 그림 없음)"
                value={editing.cover_image_url || ''}
                onChange={e => setEditing({ ...editing, cover_image_url: e.target.value })} />
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                public 폴더에 넣은 그림의 주소. 첫 페이지 제목 아래에 나옵니다.
              </p>
            </div>
            <div className="field">
              <label>완료 화면 이미지 URL</label>
              <input className="input" placeholder="예: /quest_done_4.png (비우면 퀘스트 공용 그림)"
                value={editing.clear_image_url || ''}
                onChange={e => setEditing({ ...editing, clear_image_url: e.target.value })} />
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                퀘스트 완료 화면 맨 위에 나옵니다. 비우면 퀘스트 묶음 공용 그림을 씁니다.
              </p>
            </div>
            <div className="field">
              <label>나레이션 영상 이름</label>
              <input className="input" placeholder="예: quest_01" value={editing.narration_video || ''}
                onChange={e => setEditing({ ...editing, narration_video: e.target.value })} />
              <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
                public 폴더의 <code>{`${editing.narration_video || '이름'}.mp4`}</code> 에 연결됩니다. 비워두면 시작 화면에 나레이션 버튼이 나오지 않습니다.
              </p>
            </div>
            <div className="field">
              <label>클리어 문구</label>
              <textarea style={{ minHeight: 90 }} placeholder="퀘스트를 완수했을 때 클리어 화면에 띄울 문구"
                value={editing.clear_text || ''} onChange={e => setEditing({ ...editing, clear_text: e.target.value })} />
            </div>
            <div className="field">
              <label>완수 음성</label>
              <input className="input" placeholder="예: /audio/01-suwolbong/clear.mp3"
                value={editing.clear_audio_url || ''} onChange={e => setEditing({ ...editing, clear_audio_url: e.target.value })} />
            </div>
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
