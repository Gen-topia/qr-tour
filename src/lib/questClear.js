import { pool, q } from '@/lib/db';

// 한 이야기에 묶인 미션을 모두 완수했는지 — 정기 그림을 보여줄 조건이다.
// 이야기 이름(main_title)으로 묶는다. 이름이 없는 미션은 정기를 주지 않는다.
export async function isMainCleared(userId, quest) {
  if (!quest?.main_title) return false;
  const [row] = await q(
    `SELECT COUNT(*) AS total, SUM(p.status='cleared') AS done
       FROM quests qq
       LEFT JOIN quest_progress p ON p.quest_id=qq.id AND p.user_id=?
      WHERE qq.quest_group=? AND qq.main_title=?`,
    [userId, quest.quest_group, quest.main_title]
  );
  return Number(row?.total) > 0 && Number(row?.done) === Number(row?.total);
}

export async function clearQuest(userId, questId) {
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

// 한 퀘스트 묶음(퀘스트1·2·3)의 미션을 모두 완수했는지.
// 퀘스트3까지 끝내면 최종 완료 화면으로 이어진다.
export async function isGroupCleared(userId, group) {
  const [row] = await q(
    `SELECT COUNT(*) AS total, SUM(p.status='cleared') AS done
       FROM quests qq
       LEFT JOIN quest_progress p ON p.quest_id=qq.id AND p.user_id=?
      WHERE qq.is_active=1 AND qq.quest_group=?`, [userId, group]);
  return Number(row?.total) > 0 && Number(row?.done) === Number(row?.total);
}
