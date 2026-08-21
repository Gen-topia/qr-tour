// 소셜 로그인 provider 설정 — 카카오 / 네이버
// 앱 키는 .env.local(배포 시 Vercel 환경변수)에서 읽는다.

export const PROVIDERS = {
  kakao: {
    label: '카카오',
    authUrl: 'https://kauth.kakao.com/oauth/authorize',
    tokenUrl: 'https://kauth.kakao.com/oauth/token',
    profileUrl: 'https://kapi.kakao.com/v2/user/me',
    scope: 'profile_nickname account_email phone_number',
    clientId: () => process.env.KAKAO_REST_API_KEY,
    clientSecret: () => process.env.KAKAO_CLIENT_SECRET || '',
    // 응답: { id: 1234567890, kakao_account: { email, phone_number, profile: { nickname } } }
    // 전화번호는 "+82 10-1234-5678" 꼴로 온다
    parseProfile: (d) => ({
      providerId: String(d.id),
      nickname: d.kakao_account?.profile?.nickname || null,
      email: d.kakao_account?.email || null,
      phone: d.kakao_account?.phone_number || null,
    }),
  },
  naver: {
    label: '네이버',
    authUrl: 'https://nid.naver.com/oauth2.0/authorize',
    tokenUrl: 'https://nid.naver.com/oauth2.0/token',
    profileUrl: 'https://openapi.naver.com/v1/nid/me',
    scope: '',
    clientId: () => process.env.NAVER_CLIENT_ID,
    clientSecret: () => process.env.NAVER_CLIENT_SECRET || '',
    // 응답: { resultcode: '00', response: { id, nickname, email, mobile, ... } }
    parseProfile: (d) => ({
      providerId: String(d.response?.id || ''),
      nickname: d.response?.nickname || null,
      email: d.response?.email || null,
      phone: d.response?.mobile || d.response?.mobile_e164 || null,
    }),
  },
};

// 콜백 URL은 소셜 콘솔에 등록한 값과 문자 단위로 같아야 한다.
// APP_BASE_URL 미설정 시 요청 origin으로 대체(로컬 개발용).
export function redirectUri(provider, request) {
  const base = (process.env.APP_BASE_URL || new URL(request.url).origin).replace(/\/$/, '');
  return `${base}/api/auth/${provider}/callback`;
}

// 인가 코드 → 액세스 토큰
export async function exchangeToken(p, { code, state, uri }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: p.clientId(),
    redirect_uri: uri,
    code,
    state,
  });
  const secret = p.clientSecret();
  if (secret) body.set('client_secret', secret);

  const res = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) throw new Error(data.error_description || data.error || '토큰 발급 실패');
  return data.access_token;
}

// 액세스 토큰 → { providerId, nickname }
export async function fetchProfile(p, accessToken) {
  const res = await fetch(p.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  const profile = p.parseProfile(data);
  if (!profile.providerId) throw new Error('프로필 조회 실패');
  return profile;
}
