import { pool, q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';

export async function POST(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  const { stepId, answer } = await request.json().catch(() => ({}));

  const [step] = await q('SELECT * FROM quest_steps WHERE id=? AND quest_id=?', [stepId, id]);
  if (!step || step.type !== 'quiz') return bad('퀴즈 단계가 아닙니다.');

  const correct = String(answer ?? '').trim() === String(step.answer ?? '').trim();
  if (!correct) return ok({ correct: false });

  const [last] = await q('SELECT MAX(step_no) AS mx FROM quest_steps WHERE quest_id=?', [id]);
  const isFinal = step.step_no >= Number(last.mx);

  let awarded = 0, alreadyCleared = false;
  if (isFinal) {
    const r = await clearQuest(user.id, id);
    awarded = r.awarded; alreadyCleared = r.alreadyCleared;
  }
  return ok({ correct: true, isFinal, awarded, alreadyCleared });
}

async function clearQuest(userId, questId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[quest]] = await conn.query('SELECT reward_points FROM quests WHERE id=?', [questId]);
    const [[prog]] = await conn.query('SELECT status FROM quest_progress WHERE user_id=? AND quest_id=?', [userId, questId]);
    if (prog?.status === 'cleared') { await conn.commit(); return { awarded: 0, alreadyCleared: true }; }

    await conn.query(
      `INSERT INTO quest_progress (user_id, quest_id, status, cleared_at)
       VALUES (?, ?, 'cleared', NOW())
       ON DUPLICATE KEY UPDATE status='cleared', cleared_at=NOW()`, [userId, questId]);
    await conn.query('INSERT INTO point_log (user_id, quest_id, points) VALUES (?, ?, ?)', [userId, questId, quest.reward_points]);
    await conn.query('UPDATE users SET total_points = total_points + ? WHERE id=?', [quest.reward_points, userId]);
    await conn.commit();
    return { awarded: quest.reward_points, alreadyCleared: false };
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}
