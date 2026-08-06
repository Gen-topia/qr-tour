import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

// 토큰 문자열 검증. 실패 시 null.
export function verifyToken(token, role) {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (role && decoded.role !== role) return null;
    return decoded;
  } catch { return null; }
}

// Request 헤더에서 토큰 검증. 실패 시 null.
export function verifyFrom(request, role) {
  const auth = request.headers.get('authorization') || '';
  return verifyToken(auth.replace('Bearer ', ''), role);
}

// 공통 JSON 응답 헬퍼
import { NextResponse } from 'next/server';
export const ok = (data) => NextResponse.json(data);
export const bad = (msg, code = 400) => NextResponse.json({ error: msg }, { status: code });
export const unauthorized = (msg = '인증이 필요합니다.') => NextResponse.json({ error: msg }, { status: 401 });
