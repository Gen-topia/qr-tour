import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const users = await q(
    `SELECT u.id, u.uuid, u.nickname, u.email, u.phone, u.total_points, u.created_at,
            (SELECT COUNT(*) FROM quest_progress p WHERE p.user_id=u.id AND p.status='cleared') AS cleared_count
     FROM users u ORDER BY u.id DESC`);
  return ok({ users });
}
