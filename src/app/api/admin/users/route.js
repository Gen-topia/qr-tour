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
  // 완료 시각은 DB에서 바로 글자로 만든다 — DB 시간대가 Asia/Seoul이라 그대로 우리 시각이다
  const done = await q(
    `SELECT user_id, quest_id, DATE_FORMAT(cleared_at, '%Y-%m-%d %H:%i') AS at
       FROM quest_progress WHERE status='cleared'`);
  const byUser = new Map();
  for (const r of done) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, {});
    byUser.get(r.user_id)[r.quest_id] = r.at || '';   // 예전 기록은 시각이 비어 있을 수 있다
  }

  return ok({
    quests,
    users: users.map(u => ({ ...u, cleared: byUser.get(u.id) || {} })),
  });
}
