'use client';

async function req(path, { method = 'GET', body, admin = false } = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem(admin ? 'admin_token' : 'token') : null;
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '요청 실패');
  return data;
}

export const api = {
  session: () => req('/api/auth/session', { method: 'POST' }),
  resume: (uuid) => req('/api/auth/resume', { method: 'POST', body: { uuid } }),
  testLogin: () => req('/api/auth/test', { method: 'POST' }),
  questByCode: (code) => req(`/api/quests/by-code/${encodeURIComponent(code)}`),
  questSteps: (id) => req(`/api/quests/${id}/steps`),
  submitAnswer: (id, stepId, answer) => req(`/api/quests/${id}/answer`, { method: 'POST', body: { stepId, answer } }),
  myMissions: () => req('/api/me/missions'),
  adminLogin: (username, password) => req('/api/admin/login', { method: 'POST', body: { username, password } }),
  adminQuests: () => req('/api/admin/quests', { admin: true }),
  adminCreateQuest: (b) => req('/api/admin/quests', { method: 'POST', body: b, admin: true }),
  adminUpdateQuest: (id, b) => req(`/api/admin/quests/${id}`, { method: 'PUT', body: b, admin: true }),
  adminDeleteQuest: (id) => req(`/api/admin/quests/${id}`, { method: 'DELETE', admin: true }),
  adminGetSteps: (id) => req(`/api/admin/quests/${id}/steps`, { admin: true }),
  adminPutSteps: (id, steps) => req(`/api/admin/quests/${id}/steps`, { method: 'PUT', body: { steps }, admin: true }),
  adminUsers: () => req('/api/admin/users', { admin: true }),
};
