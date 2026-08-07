import { pool, q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';
import { isPlayable, SERVER_VERIFIED } from '@/lib/stepTypes';

// 유형별 완료 판정.
// quiz·dial은 서버가 값을 검증하고, 나머지 인터랙션 유형은 클라이언트의 완료 신호를 받는다.
function judge(step, answer) {
  if (step.type === 'quiz') {
    return String(answer ?? '').trim() === String(step.answer ?? '').trim();
  }
  if (step.type === 'dial') {
    const cfg = step.config || {};
    const target = Number(cfg.target_angle ?? 0);
    const tol = Number(cfg.tolerance ?? 12);
    const angle = Number(answer?.angle);
    if (!Number.isFinite(angle)) return false;
    // 두 각도의 최소 차이를 0~180으로 정규화해 비교(359°와 1°의 차이는 2°)
    const diff = Math.abs(((angle - target + 540) % 360) - 180);
    return diff <= tol;
  }
  // puzzle · scratch · gauge — 클라이언트가 완료를 판정한다
  return answer?.done === true;
}

export async function POST(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  const { stepId, answer } = await request.json().catch(() => ({}));

  const [step] = await q('SELECT * FROM quest_steps WHERE id=? AND quest_id=?', [stepId, id]);
  if (!step || !isPlayable(step.type)) return bad('완료 처리할 수 있는 단계가 아닙니다.');

  const correct = judge(step, answer);
  if (!correct) return ok({ correct: false, verified: SERVER_VERIFIED.includes(step.type) });

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
