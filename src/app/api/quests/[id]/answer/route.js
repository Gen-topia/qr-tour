import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';
import { isPlayable, SERVER_VERIFIED } from '@/lib/stepTypes';
import { lockReason } from '@/lib/questLock';
import { clearQuest, isMainCleared, isGroupCleared } from '@/lib/questClear';

// 유형별 완료 판정.
// quiz·dial은 서버가 값을 검증하고, 나머지 인터랙션 유형은 클라이언트의 완료 신호를 받는다.
function judge(step, answer) {
  // 정답이 아직 정해지지 않은 문제는 config에 { "skip": true }를 둬서 건너뛸 수 있게 한다.
  // 정답이 확정되면 이 설정만 지우면 된다.
  if (step.config?.skip && answer?.skip === true) return true;

  if (step.type === 'quiz') {
    // 정답을 |로 나눠 적어두면 그 중 아무거나 맞으면 통과한다.
    // (안내판을 ‘나’로 읽는 사람과 ‘나나’로 읽는 사람이 갈리는 문제 등)
    const given = String(answer ?? '').trim();
    return String(step.answer ?? '').split('|').some(a => a.trim() === given);
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
  // puzzle · clear · draw · way · scratch · gauge — 클라이언트가 완료를 판정한다
  // story — 읽는 것으로 끝나는 미션(QR을 비추면 성공)이라 완료 신호만 받는다
  return answer?.done === true;
}

export async function POST(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  const { stepId, stepNo, answer } = await request.json().catch(() => ({}));

  const [quest] = await q('SELECT id, quest_group, main_no, main_title FROM quests WHERE id=?', [id]);
  const locked = quest ? await lockReason(user.id, quest.quest_group, quest.id) : null;
  if (locked) return bad(locked.replace('\n', ' '), 403);

  let [step] = await q('SELECT * FROM quest_steps WHERE id=? AND quest_id=?', [stepId, id]);
  // 관리툴에서 미션을 다시 저장하면 장의 id가 새로 생긴다.
  // 이미 열어 둔 화면이 옛 id로 제출해도 막히지 않게 장 번호로 한 번 더 찾는다.
  if (!step && stepNo) {
    [step] = await q('SELECT * FROM quest_steps WHERE quest_id=? AND step_no=?', [id, stepNo]);
  }
  // 이야기만으로 끝나는 미션도 마지막 장에서 완료할 수 있어야 한다
  if (!step || !(isPlayable(step.type) || step.type === 'story')) return bad('완료 처리할 수 있는 단계가 아닙니다.');

  const correct = judge(step, answer);
  if (!correct) return ok({ correct: false, verified: SERVER_VERIFIED.includes(step.type) });

  const [last] = await q('SELECT MAX(step_no) AS mx FROM quest_steps WHERE quest_id=?', [id]);
  const isFinal = step.step_no >= Number(last.mx);

  let awarded = 0, alreadyCleared = false, mainCleared = false, groupCleared = false;
  if (isFinal) {
    const r = await clearQuest(user.id, id);
    awarded = r.awarded; alreadyCleared = r.alreadyCleared;
    mainCleared = await isMainCleared(user.id, quest);
    groupCleared = await isGroupCleared(user.id, quest.quest_group);
  }
  return ok({ correct: true, isFinal, awarded, alreadyCleared, mainCleared, groupCleared, mainNo: quest?.main_no ?? null });
}
