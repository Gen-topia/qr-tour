import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const users = await q(
    `SELECT u.id, u.uuid, u.nickname, u.email, u.phone, u.total_points, u.created_at,
            (SELECT COUNT(*) FROM quest_progress p WHERE p.user_id=u.id AND p.status='cleared') AS cleared_count
     FROM users u ORDER BY u.id DESC`);

  // 참가자마다 어느 미션을 깼는지 — 사전 퀘스트부터 순서대로 보여주기 위해 미션 목록도 함께 내려준다
  const quests = await q(
    'SELECT id, title, order_no FROM quests WHERE is_active=1 ORDER BY order_no ASC');
  const done = await q("SELECT user_id, quest_id FROM quest_progress WHERE status='cleared'");
  const byUser = new Map();
  for (const r of done) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id).push(r.quest_id);
  }

  return ok({
    quests,
    users: users.map(u => ({ ...u, cleared: byUser.get(u.id) || [] })),
  });
}
