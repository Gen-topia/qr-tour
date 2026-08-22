import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';
import { isPlayable, SERVER_VERIFIED } from '@/lib/stepTypes';
import { lockReason } from '@/lib/questLock';
import { clearQuest, isMainCleared } from '@/lib/questClear';

// 유형별 완료 판정.
// quiz·dial은 서버가 값을 검증하고, 나머지 인터랙션 유형은 클라이언트의 완료 신호를 받는다.
function judge(step, answer) {
  // 정답이 아직 정해지지 않은 문제는 config에 { "skip": true }를 둬서 건너뛸 수 있게 한다.
  // 정답이 확정되면 이 설정만 지우면 된다.
  if (step.config?.skip && answer?.skip === true) return true;

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
  // puzzle · clear · scratch · gauge — 클라이언트가 완료를 판정한다
  // story — 읽는 것으로 끝나는 미션(QR을 비추면 성공)이라 완료 신호만 받는다
  return answer?.done === true;
}

export async function POST(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  const { stepId, answer } = await request.json().catch(() => ({}));

  const [quest] = await q('SELECT id, quest_group, main_no, main_title FROM quests WHERE id=?', [id]);
  const locked = quest ? await lockReason(user.id, quest.quest_group, quest.id) : null;
  if (locked) return bad(locked.replace('\n', ' '), 403);

  const [step] = await q('SELECT * FROM quest_steps WHERE id=? AND quest_id=?', [stepId, id]);
  // 이야기만으로 끝나는 미션도 마지막 장에서 완료할 수 있어야 한다
  if (!step || !(isPlayable(step.type) || step.type === 'story')) return bad('완료 처리할 수 있는 단계가 아닙니다.');

  const correct = judge(step, answer);
  if (!correct) return ok({ correct: false, verified: SERVER_VERIFIED.includes(step.type) });

  const [last] = await q('SELECT MAX(step_no) AS mx FROM quest_steps WHERE quest_id=?', [id]);
  const isFinal = step.step_no >= Number(last.mx);

  let awarded = 0, alreadyCleared = false, mainCleared = false;
  if (isFinal) {
    const r = await clearQuest(user.id, id);
    awarded = r.awarded; alreadyCleared = r.alreadyCleared;
    mainCleared = await isMainCleared(user.id, quest);
  }
  return ok({ correct: true, isFinal, awarded, alreadyCleared, mainCleared, mainNo: quest?.main_no ?? null });
}
