import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  // 시작 화면(제목·나레이션 영상·클리어 이미지)에 쓸 미션 정보를 함께 내려준다
  const [quest] = await q(
    'SELECT id, title, quest_group, cover_image_url, narration_video FROM quests WHERE id=?', [id]
  );
  const steps = await q(
    'SELECT id, step_no, type, title, body_text, image_url, audio_url, hint_text, question, options, config FROM quest_steps WHERE quest_id=? ORDER BY step_no ASC',
    [id]
  );
  // answer 컬럼은 미포함. dial의 목표 각도는 config에 있지만, 어차피 그만큼 돌려야 하므로 노출해도 무방하다.
  return ok({ quest: quest || null, steps });
}
