import { q } from '@/lib/db';
import { signToken, ok, bad } from '@/lib/auth';

export async function POST(request) {
  const { uuid } = await request.json().catch(() => ({}));
  const rows = await q('SELECT id, nickname, total_points FROM users WHERE uuid=?', [uuid]);
  if (!rows[0]) return bad('등록되지 않은 사용자', 404);
  const token = signToken({ id: rows[0].id, role: 'user' });
  return ok({ uuid, token, user: rows[0] });
}
