import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { code } = await params;

  const [quest] = await q('SELECT * FROM quests WHERE code=? AND is_active=1', [code]);
  if (!quest) return bad('존재하지 않는 코드입니다.', 404);

  const [{ cnt }] = await q('SELECT COUNT(*) AS cnt FROM quest_steps WHERE quest_id=?', [quest.id]);
  const [prog] = await q('SELECT status FROM quest_progress WHERE user_id=? AND quest_id=?', [user.id, quest.id]);

  return ok({
    quest: { id: quest.id, code: quest.code, title: quest.title, order_no: quest.order_no,
             cover_image_url: quest.cover_image_url, reward_points: quest.reward_points },
    stepCount: Number(cnt),
    status: prog?.status || 'new',
  });
}
