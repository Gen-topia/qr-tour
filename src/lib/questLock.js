import { q } from '@/lib/db';
import { QUEST_REQUIRES, groupLabel } from '@/lib/questGroups';

// 선행 퀘스트를 모두 완수해야 열리는 퀘스트인지 서버에서 확인한다.
// 잠겨 있으면 안내 문구를, 열려 있으면 null을 돌려준다.
export async function lockReason(userId, questGroup) {
  const need = QUEST_REQUIRES[questGroup];
  if (!need) return null;

  const [row] = await q(
    `SELECT COUNT(*) AS total, SUM(p.status = 'cleared') AS done
       FROM quests qs
       LEFT JOIN quest_progress p ON p.quest_id = qs.id AND p.user_id = ?
      WHERE qs.quest_group = ? AND qs.is_active = 1`,
    [userId, need]
  );
  const total = Number(row?.total || 0);
  const done = Number(row?.done || 0);
  if (total === 0 || done >= total) return null;

  return `${groupLabel(need)}의 모든 퀘스트를 완수하세요.\n`
       + `지금까지 ${done}/${total} 완수했습니다.`;
}
