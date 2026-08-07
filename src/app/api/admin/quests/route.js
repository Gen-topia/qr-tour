import { customAlphabet } from 'nanoid';
import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

const shortCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  // 목록에서 미션 유형을 바로 보여주기 위해 스텝 유형을 함께 모아온다
  const quests = await q(
    `SELECT qs.*, GROUP_CONCAT(DISTINCT s.type ORDER BY s.type) AS step_types
     FROM quests qs LEFT JOIN quest_steps s ON s.quest_id = qs.id
     GROUP BY qs.id ORDER BY qs.order_no ASC`);
  return ok({ quests: quests.map(x => ({ ...x, step_types: x.step_types ? x.step_types.split(',') : [] })) });
}

export async function POST(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const b = await request.json().catch(() => ({}));
  const code = b.code || shortCode();
  const r = await q(
    'INSERT INTO quests (code, title, order_no, cover_image_url, reward_points, is_active) VALUES (?,?,?,?,?,?)',
    [code, b.title || '제목없음', b.order_no || 0, b.cover_image_url || null, b.reward_points ?? 100, b.is_active ?? 1]);
  return ok({ id: r.insertId, code });
}
