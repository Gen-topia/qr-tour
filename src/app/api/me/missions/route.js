import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();

  const [me] = await q('SELECT id, nickname, total_points, sky_key_at FROM users WHERE id=?', [user.id]);
  // 줄이 사라진 토큰으로 들어오면 완수한 것이 하나도 없는 것처럼 보인다 — 그럴 땐 다시 로그인시킨다
  if (!me) return unauthorized('로그인이 만료되었어요. 다시 로그인해 주세요.');
  const quests = await q(
    `SELECT q.id, q.title, q.order_no, q.quest_group, q.main_no, q.main_title, q.place, q.reward_points,
            (p.status='cleared') AS cleared
     FROM quests q LEFT JOIN quest_progress p ON p.quest_id=q.id AND p.user_id=?
     WHERE q.is_active=1 ORDER BY q.order_no ASC`, [user.id]);

  const total = quests.length;
  const done = quests.filter(x => Number(x.cleared)).length;
  return ok({
    user: me, totalPoints: me?.total_points ?? 0,
    skyKey: !!me?.sky_key_at,
    progress: { done, total },
    quests: quests.map(x => ({ id: x.id, title: x.title, order_no: x.order_no, quest_group: x.quest_group,
      main_no: x.main_no, main_title: x.main_title,
      place: x.place, reward_points: x.reward_points, cleared: !!Number(x.cleared) })),
  });
}
