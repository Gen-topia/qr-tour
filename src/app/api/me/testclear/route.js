import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';
import { lockReason } from '@/lib/questLock';
import { clearQuest, isMainCleared } from '@/lib/questClear';

// 테스트용 — 미션 화면에서 Ctrl+2를 누르면 이 미션을 곧바로 완수 처리한다.
// 문제를 풀지 않고 진행을 채우므로, 행사 전에는 이 파일을 지워야 한다.
// (같이 지울 곳: apiClient의 testClear, quest/[id] 화면의 Ctrl+2 처리)
export async function POST(request) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { questId } = await request.json().catch(() => ({}));

  const [quest] = await q('SELECT id, quest_group, main_no, main_title FROM quests WHERE id=?', [questId]);
  if (!quest) return bad('없는 미션입니다.');
  // 잠긴 미션은 정상 진행과 똑같이 막는다
  const locked = await lockReason(user.id, quest.quest_group, quest.id);
  if (locked) return bad(locked.replace('\n', ' '), 403);

  const r = await clearQuest(user.id, quest.id);
  const mainCleared = await isMainCleared(user.id, quest);
  return ok({ awarded: r.awarded, alreadyCleared: r.alreadyCleared, mainCleared, mainNo: quest.main_no ?? null });
}
