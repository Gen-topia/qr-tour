import { q } from '@/lib/db';

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
  // 트랜잭션으로 커넥션을 붙잡고 있으면 서버리스에서 커넥션이 모자라 요청이 통째로 실패한다.
  // 그래서 짧은 문장 둘로 나눈다.
  //  1) 진행 줄이 없으면 만든다(이미 있으면 그대로 둔다)
  //  2) '아직 안 깼을 때만' 완수로 바꾼다 — 이 한 문장이 실제로 바꾼 경우에만 점수를 준다.
  //     같은 요청이 두 번 오거나 두 창에서 동시에 눌러도 점수는 한 번만 쌓인다.
  await q(`INSERT IGNORE INTO quest_progress (user_id, quest_id, status) VALUES (?, ?, 'unlocked')`,
          [userId, questId]);
  const upd = await q(
    `UPDATE quest_progress SET status='cleared', cleared_at=NOW()
      WHERE user_id=? AND quest_id=? AND status<>'cleared'`, [userId, questId]);
  if (!upd.affectedRows) return { awarded: 0, alreadyCleared: true };

  const [quest] = await q('SELECT reward_points FROM quests WHERE id=?', [questId]);
  const points = Number(quest?.reward_points || 0);
  if (points > 0) {
    await q('INSERT INTO point_log (user_id, quest_id, points) VALUES (?, ?, ?)', [userId, questId, points]);
    await q('UPDATE users SET total_points = total_points + ? WHERE id=?', [points, userId]);
  }
  return { awarded: points, alreadyCleared: false };
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
