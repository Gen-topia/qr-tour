'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './apiClient';

const AuthCtx = createContext(null);
const K_UUID = 'tour_uuid', K_TOKEN = 'token', K_USER = 'user';

export function AuthProvider({ children }) {
  const [uuid, setUuid] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const savedUuid = localStorage.getItem(K_UUID);
      const savedToken = localStorage.getItem(K_TOKEN);
      if (savedToken) { setToken(savedToken); setUuid(savedUuid);
        try { setUser(JSON.parse(localStorage.getItem(K_USER) || 'null')); } catch {} }
      else if (savedUuid) {
        try { persist(await api.resume(savedUuid)); } catch {}
      }
      setReady(true);
    })();
  }, []);

  function persist({ uuid, token, user }) {
    localStorage.setItem(K_UUID, uuid);
    localStorage.setItem(K_TOKEN, token);
    localStorage.setItem(K_USER, JSON.stringify(user));
    setUuid(uuid); setToken(token); setUser(user);
  }
  // 소셜 로그인 콜백 직후: 서버가 심어둔 세션 쿠키를 토큰으로 교환해 저장
  async function completeSocialLogin() { const r = await api.session(); persist(r); return r; }
  // 테스트 버튼: 소셜 인증 없이 테스트 계정 토큰을 받아 저장
  async function loginAsTest() { const r = await api.testLogin(); persist(r); return r; }
  function reset() { [K_UUID, K_TOKEN, K_USER].forEach(k => localStorage.removeItem(k)); setUuid(null); setToken(null); setUser(null); }

  return <AuthCtx.Provider value={{ uuid, token, user, ready, isAuthed: !!token, completeSocialLogin, loginAsTest, reset }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
