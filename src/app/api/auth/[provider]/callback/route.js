import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { PROVIDERS, redirectUri, exchangeToken, fetchProfile } from '@/lib/oauth';

// GET /api/auth/kakao/callback?code=...&state=...
// 인가 코드로 프로필을 받아 users에 upsert → JWT를 임시 쿠키에 담고 /auth/complete로 보낸다.
export async function GET(request, { params }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (msg) => NextResponse.redirect(`${origin}/?error=${encodeURIComponent(msg)}`);

  const p = PROVIDERS[provider];
  if (!p) return fail('지원하지 않는 로그인 방식입니다.');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = request.cookies.get('oauth_state')?.value;
  const next = request.cookies.get('oauth_next')?.value || '/';

  console.log(`[auth/${provider}/callback] 진입 — origin:`, origin,
    '/ code:', code ? code.slice(0, 10) + '…' : '없음',
    '/ state(query):', state?.slice(0, 8) || '없음',
    '/ state(cookie):', savedState?.slice(0, 8) || '없음');

  if (!code) return fail('로그인이 취소되었습니다.');
  if (!state || state !== savedState) return fail('로그인 요청이 만료되었습니다. 다시 시도해 주세요.');

  let profile;
  try {
    const uri = redirectUri(provider, request);
    console.log(`[auth/${provider}/callback] 토큰 교환 redirect_uri:`, uri);
    const accessToken = await exchangeToken(p, { code, state, uri });
    profile = await fetchProfile(p, accessToken);
  } catch (e) {
    console.error(`[auth/${provider}/callback] 토큰·프로필 실패:`, e.message);
    return fail(`${p.label} 로그인에 실패했습니다: ${e.message}`);
  }
  console.log(`[auth/${provider}/callback] 프로필 조회 성공 — providerId:`, profile.providerId,
    '/ nickname:', profile.nickname);

  // 이미 가입한 계정이면 기존 id를 그대로 반환(ON DUPLICATE KEY UPDATE + LAST_INSERT_ID)
  const r = await q(
    `INSERT INTO users (uuid, provider, provider_id, nickname) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [randomUUID(), provider, profile.providerId, profile.nickname]
  );
  console.log(`[auth/${provider}/callback] users 저장 완료 — userId:`, r.insertId,
    '/ affectedRows:', r.affectedRows);
  const token = signToken({ id: r.insertId, role: 'user' });

  const res = NextResponse.redirect(`${origin}/auth/complete?next=${encodeURIComponent(next)}`);
  res.cookies.set('tour_session', token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 300,
    secure: process.env.NODE_ENV === 'production',
  });
  res.cookies.delete('oauth_state');
  res.cookies.delete('oauth_next');
  return res;
}
