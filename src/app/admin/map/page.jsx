'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/apiClient';

// 파수꾼 코드 지도 편집 — 참가자 화면(/map)에 그대로 나가는 내용이다.
const EMPTY_SPOT = { code: '', name: '', sub: '', address: '', map: '', hours: '', tel: '', notes: [], link: null };

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>{hint}</p>}
    </div>
  );
}

function CodeMap() {
  const [map, setMap] = useState(null);
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.adminSpots().then(r => setMap(r.map)).catch(e => alert(e.message)); }, []);
  if (!map) return <p className="muted">불러오는 중…</p>;

  // 그룹/장소는 배열이라 통째로 갈아끼우는 편이 실수가 적다
  const setGroups = (groups) => { setMap(m => ({ ...m, groups })); setSaved(''); };
  const patchGroup = (gi, patch) => setGroups(map.groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const patchSpot = (gi, si, patch) =>
    patchGroup(gi, { items: map.groups[gi].items.map((s, i) => (i === si ? { ...s, ...patch } : s)) });

  const addGroup = () => setGroups([...map.groups, { group: '새 그룹', items: [] }]);
  const delGroup = (gi) => {
    if (!confirm(`«${map.groups[gi].group}» 그룹을 통째로 지울까요?`)) return;
    setGroups(map.groups.filter((_, i) => i !== gi));
  };
  const addSpot = (gi) => patchGroup(gi, { items: [...map.groups[gi].items, { ...EMPTY_SPOT }] });
  const delSpot = (gi, si) => {
    if (!confirm(`«${map.groups[gi].items[si].name || '이름 없음'}» 장소를 지울까요?`)) return;
    patchGroup(gi, { items: map.groups[gi].items.filter((_, i) => i !== si) });
  };
  const moveSpot = (gi, si, dir) => {
    const items = [...map.groups[gi].items];
    const to = si + dir;
    if (to < 0 || to >= items.length) return;
    [items[si], items[to]] = [items[to], items[si]];
    patchGroup(gi, { items });
  };

  async function save() {
    setBusy(true);
    try { const r = await api.adminSaveSpots(map); setMap(r.map); setSaved('저장했습니다.'); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>코드 지도</h1>
        <div className="row-actions">
          {saved && <span className="muted" style={{ fontSize: 13 }}>{saved}</span>}
          <button className="btn sm ghost" onClick={addGroup}>+ 그룹 추가</button>
          <button className="btn sm" onClick={save} disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
        </div>
      </div>

      <div className="card stack" style={{ marginBottom: 18 }}>
        <Field label="안내 문구" hint="지도 화면 맨 위 제목 아래에 나옵니다. 줄바꿈이 그대로 반영됩니다.">
          <textarea style={{ minHeight: 70 }} value={map.lead || ''}
                    onChange={e => { setMap(m => ({ ...m, lead: e.target.value })); setSaved(''); }} />
        </Field>
        <Field label="지도 그림 경로" hint="public 폴더 기준 경로입니다. 비우면 그림 없이 목록만 나옵니다.">
          <input className="input" placeholder="/map.png" value={map.image || ''}
                 onChange={e => { setMap(m => ({ ...m, image: e.target.value })); setSaved(''); }} />
        </Field>
      </div>

      {map.groups.map((g, gi) => (
        <div key={gi} className="card stack" style={{ marginBottom: 18 }}>
          <div className="spread">
            <input className="input" style={{ fontWeight: 700, maxWidth: 260 }} value={g.group}
                   onChange={e => patchGroup(gi, { group: e.target.value })} />
            <div className="row-actions">
              <button className="btn sm ghost" onClick={() => addSpot(gi)}>+ 장소 추가</button>
              <button className="btn sm danger" onClick={() => delGroup(gi)}>그룹 삭제</button>
            </div>
          </div>

          {g.items.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 13 }}>장소가 없습니다.</p>}

          {g.items.map((s, si) => (
            <div key={si} className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 14 }}>{s.name || '(이름 없음)'}</b>
                <div className="row-actions">
                  <button className="btn sm ghost" onClick={() => moveSpot(gi, si, -1)} disabled={si === 0}>↑</button>
                  <button className="btn sm ghost" onClick={() => moveSpot(gi, si, 1)} disabled={si === g.items.length - 1}>↓</button>
                  <button className="btn sm danger" onClick={() => delSpot(gi, si)}>삭제</button>
                </div>
              </div>

              <div className="grid2">
                <Field label="장소 이름"><input className="input" value={s.name || ''}
                  onChange={e => patchSpot(gi, si, { name: e.target.value })} /></Field>
                <Field label="부제 (선택)"><input className="input" placeholder="예: 신창 풍차해안 공영주차장"
                  value={s.sub || ''} onChange={e => patchSpot(gi, si, { sub: e.target.value })} /></Field>
              </div>

              <Field label="주소"><input className="input" value={s.address || ''}
                onChange={e => patchSpot(gi, si, { address: e.target.value })} /></Field>

              <div className="grid2">
                <Field label="운영 시간 (선택)"><input className="input" placeholder="매일 09:00 ~ 18:00"
                  value={s.hours || ''} onChange={e => patchSpot(gi, si, { hours: e.target.value })} /></Field>
                <Field label="문의 전화 (선택)"><input className="input" placeholder="064-000-0000"
                  value={s.tel || ''} onChange={e => patchSpot(gi, si, { tel: e.target.value })} /></Field>
              </div>

              <div className="grid2">
                <Field label="장소 코드" hint="미션 편집의 «장소»와 이어지는 값입니다. 바꾸면 연결이 끊깁니다.">
                  <input className="input" value={s.code || ''}
                         onChange={e => patchSpot(gi, si, { code: e.target.value })} />
                </Field>
                <Field label="지도 검색어 (선택)" hint="비우면 장소 이름으로 네이버 지도를 찾습니다.">
                  <input className="input" value={s.map || ''}
                         onChange={e => patchSpot(gi, si, { map: e.target.value })} />
                </Field>
              </div>

              <Field label="안내 (선택)" hint="한 줄에 하나씩 적으면 ※ 표시로 하나씩 나옵니다.">
                <textarea style={{ minHeight: 60 }} value={(s.notes || []).join('\n')}
                  onChange={e => patchSpot(gi, si, { notes: e.target.value.split('\n') })} />
              </Field>

              <div className="grid2">
                <Field label="버튼 이름 (선택)"><input className="input" placeholder="물때표 확인하기"
                  value={s.link?.label || ''}
                  onChange={e => patchSpot(gi, si, { link: { ...(s.link || {}), label: e.target.value } })} /></Field>
                <Field label="버튼 주소 (선택)" hint="주소를 비우면 버튼이 나오지 않습니다.">
                  <input className="input" placeholder="https://…" value={s.link?.url || ''}
                    onChange={e => patchSpot(gi, si, { link: { ...(s.link || {}), url: e.target.value } })} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
        {saved && <span className="muted" style={{ fontSize: 13 }}>{saved}</span>}
        <button className="btn sm" onClick={save} disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
      </div>
    </div>
  );
}
export default function Page() { return <AdminShell><CodeMap /></AdminShell>; }
