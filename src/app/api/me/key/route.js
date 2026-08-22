import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';

// 하늘 문 열쇠 얻기 — 퀘스트1을 모두 완수한 사람만, 복숭아를 딴 시각을 한 번만 남긴다.
export async function POST(request) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();

  const [row] = await q(
    `SELECT COUNT(*) AS total, SUM(p.status='cleared') AS done
       FROM quests q LEFT JOIN quest_progress p ON p.quest_id=q.id AND p.user_id=?
      WHERE q.is_active=1 AND q.quest_group=1`, [user.id]);
  const total = Number(row?.total || 0);
  if (!total || Number(row?.done || 0) < total) return bad('퀘스트1을 모두 완수해야 합니다.');

  // 이미 얻었으면 시각을 덮어쓰지 않는다
  await q('UPDATE users SET sky_key_at=NOW() WHERE id=? AND sky_key_at IS NULL', [user.id]);
  return ok({ skyKey: true });
}
