import { q } from '@/lib/db';
import { QUEST_REQUIRES, SEQUENTIAL_GROUPS, groupLabel } from '@/lib/questGroups';

// 지금 이 미션에 들어갈 수 있는지 서버에서 확인한다.
// 잠겨 있으면 안내 문구를, 열려 있으면 null을 돌려준다.
//   1) 선행 퀘스트 조건 — 예: 퀘스트3은 퀘스트1을 모두 완수해야 열린다
//   2) 순차 진행 조건 — 이야기가 이어지는 퀘스트2·3은 앞 순서부터 차례로 깨야 한다
export async function lockReason(userId, questGroup, questId) {
  const need = QUEST_REQUIRES[questGroup];
  if (need) {
    const [row] = await q(
      `SELECT COUNT(*) AS total, SUM(p.status = 'cleared') AS done
         FROM quests qs
         LEFT JOIN quest_progress p ON p.quest_id = qs.id AND p.user_id = ?
        WHERE qs.quest_group = ? AND qs.is_active = 1`,
      [userId, need]
    );
    const total = Number(row?.total || 0);
    const done = Number(row?.done || 0);
    if (total > 0 && done < total) {
      return `${groupLabel(need)}의 모든 퀘스트를 완수하세요.\n`
           + `지금까지 ${done}/${total} 완수했습니다.`;
    }
  }

  if (!questId || !SEQUENTIAL_GROUPS.includes(Number(questGroup))) return null;

  // 같은 퀘스트 안에서 나보다 앞 순서인데 아직 못 깬 미션을 찾는다
  const [prev] = await q(
    `SELECT qs.title
       FROM quests qs
       LEFT JOIN quest_progress p ON p.quest_id = qs.id AND p.user_id = ?
      WHERE qs.quest_group = ? AND qs.is_active = 1
        AND qs.order_no < (SELECT order_no FROM quests WHERE id = ?)
        AND (p.status IS NULL OR p.status <> 'cleared')
      ORDER BY qs.order_no ASC
      LIMIT 1`,
    [userId, questGroup, questId]
  );
  if (!prev) return null;

  return `이야기 순서대로 진행해 주세요.\n먼저 ‘${prev.title}’을(를) 완수해야 합니다.`;
}
