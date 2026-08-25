import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';

// 참가자 계정 삭제.
// quest_progress·point_log는 users를 참조하며 ON DELETE CASCADE라 진행 기록도 함께 지워진다.
// 지운 뒤 그 사람이 앱을 열면 토큰이 가리키는 줄이 없으므로 다시 로그인(=새 가입)하게 된다.
export async function DELETE(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  const [user] = await q('SELECT id, nickname, email FROM users WHERE id=?', [id]);
  if (!user) return bad('없는 참가자입니다.', 404);
  await q('DELETE FROM users WHERE id=?', [id]);
  return ok({ deleted: user });
}
