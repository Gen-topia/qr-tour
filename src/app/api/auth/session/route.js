import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// POST /api/auth/session
// 콜백이 심어둔 임시 쿠키(tour_session)를 1회 소비해 클라이언트에 토큰/유저를 넘긴다.
// (토큰을 URL 쿼리로 노출하지 않기 위한 단계)
export async function POST(request) {
  const token = request.cookies.get('tour_session')?.value;
  const decoded = token && verifyToken(token, 'user');
  if (!decoded) return unauthorized('로그인 세션이 없습니다.');

  const rows = await q('SELECT id, uuid, nickname, total_points FROM users WHERE id=?', [decoded.id]);
  if (!rows[0]) return unauthorized('사용자를 찾을 수 없습니다.');

  const { uuid, ...user } = rows[0];
  const res = NextResponse.json({ uuid, token, user });
  res.cookies.delete('tour_session');
  return res;
}
