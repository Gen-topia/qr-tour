'use client';

async function req(path, { method = 'GET', body, admin = false } = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem(admin ? 'admin_token' : 'token') : null;
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // 신호가 끊겼거나 서버에 닿지 못한 경우 — 다시 눌러 보라고 알려준다
    throw new Error('연결이 끊겼어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = await res.json().catch(() => ({}));
  // 서버가 오류를 HTML로 뱉으면 error가 비어 원인을 알 수 없다. 적어도 상태 번호는 남긴다.
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

// 파일을 내려받는 요청 — 응답이 JSON이 아니므로 그대로 Blob으로 받는다
async function fileReq(path) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('요청 실패');
  return res.blob();
}

export const api = {
  session: () => req('/api/auth/session', { method: 'POST' }),
  resume: (uuid) => req('/api/auth/resume', { method: 'POST', body: { uuid } }),
  testLogin: () => req('/api/auth/test', { method: 'POST' }),
  questByCode: (code) => req(`/api/quests/by-code/${encodeURIComponent(code)}`),
  questSteps: (id) => req(`/api/quests/${id}/steps`),
  submitAnswer: (id, stepId, answer, stepNo) => req(`/api/quests/${id}/answer`, { method: 'POST', body: { stepId, stepNo, answer } }),
  myMissions: () => req('/api/me/missions'),
  claimSkyKey: () => req('/api/me/key', { method: 'POST' }),
  // 테스트용 — 행사 전에 서버의 /api/me/testclear와 함께 지운다
  testClear: (questId) => req('/api/me/testclear', { method: 'POST', body: { questId } }),
  adminLogin: (username, password) => req('/api/admin/login', { method: 'POST', body: { username, password } }),
  adminQuests: () => req('/api/admin/quests', { admin: true }),
  adminCreateQuest: (b) => req('/api/admin/quests', { method: 'POST', body: b, admin: true }),
  adminUpdateQuest: (id, b) => req(`/api/admin/quests/${id}`, { method: 'PUT', body: b, admin: true }),
  adminDeleteQuest: (id) => req(`/api/admin/quests/${id}`, { method: 'DELETE', admin: true }),
  adminGetSteps: (id) => req(`/api/admin/quests/${id}/steps`, { admin: true }),
  adminPutSteps: (id, steps) => req(`/api/admin/quests/${id}/steps`, { method: 'PUT', body: { steps }, admin: true }),
  adminUsers: () => req('/api/admin/users', { admin: true }),
  adminUsersXlsx: () => fileReq('/api/admin/users/export'),

  // 앱 오픈 여부
  settings: () => req('/api/settings'),
  spots: () => req('/api/spots'),
  adminSpots: () => req('/api/admin/spots', { admin: true }),
  adminSaveSpots: (map) => req('/api/admin/spots', { method: 'PUT', body: { map }, admin: true }),
  adminSettings: () => req('/api/admin/settings', { admin: true }),
  adminSetOpen: (questOpen) => req('/api/admin/settings', { method: 'PUT', body: { questOpen }, admin: true }),

  // 오픈 전 예외 허용(테스터)
  myAccess: () => req('/api/me/access'),
  adminTesters: () => req('/api/admin/testers', { admin: true }),
  adminAddTester: (email, note) => req('/api/admin/testers', { method: 'POST', body: { email, note }, admin: true }),
  adminDelTester: (email) => req(`/api/admin/testers?email=${encodeURIComponent(email)}`, { method: 'DELETE', admin: true }),
};
