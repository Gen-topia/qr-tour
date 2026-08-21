import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';

// 오픈 전에도 앱을 쓸 수 있는 테스터 이메일 목록.
// 소셜 로그인으로 받은 이메일과 대조하므로 실제 카카오·네이버 계정 이메일이어야 한다.
export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  return ok({ testers: await q('SELECT email, note, created_at FROM testers ORDER BY created_at DESC') });
}

export async function POST(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const b = await request.json().catch(() => ({}));
  const email = String(b.email ?? '').trim().toLowerCase();
  if (!email.includes('@')) return bad('올바른 이메일을 입력해 주세요.');
  await q(
    'INSERT INTO testers (email, note) VALUES (?, ?) ON DUPLICATE KEY UPDATE note = VALUES(note)',
    [email, b.note?.trim() || null]
  );
  return ok({ email });
}

export async function DELETE(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const email = new URL(request.url).searchParams.get('email');
  if (!email) return bad('삭제할 이메일이 없습니다.');
  await q('DELETE FROM testers WHERE LOWER(email)=?', [email.trim().toLowerCase()]);
  return ok({ ok: true });
}
