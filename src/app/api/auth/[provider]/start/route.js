import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { PROVIDERS, redirectUri } from '@/lib/oauth';
import { bad } from '@/lib/auth';

// GET /api/auth/kakao/start?next=/scan  → 소셜 인가 페이지로 리다이렉트
export async function GET(request, { params }) {
  const { provider } = await params;
  const p = PROVIDERS[provider];
  if (!p) return bad('지원하지 않는 로그인 방식', 404);
  if (!p.clientId()) return bad(`${p.label} 앱 키가 설정되지 않았습니다.`, 500);

  // CSRF 방지용 state — 쿠키에 심고 콜백에서 대조
  const state = randomUUID();
  // open redirect 방지: 내부 경로만 허용
  const nextParam = new URL(request.url).searchParams.get('next') || '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  const auth = new URL(p.authUrl);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('client_id', p.clientId());
  auth.searchParams.set('redirect_uri', redirectUri(provider, request));
  auth.searchParams.set('state', state);
  if (p.scope) auth.searchParams.set('scope', p.scope);

  const res = NextResponse.redirect(auth.toString());
  const opts = { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 300, secure: process.env.NODE_ENV === 'production' };
  res.cookies.set('oauth_state', state, opts);
  res.cookies.set('oauth_next', next, opts);
  return res;
}
