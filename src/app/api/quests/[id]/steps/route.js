import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  const steps = await q(
    'SELECT id, step_no, type, title, body_text, image_url, audio_url, hint_text, question, options, config FROM quest_steps WHERE quest_id=? ORDER BY step_no ASC',
    [id]
  );
  // answer 컬럼은 미포함. dial의 목표 각도는 config에 있지만, 어차피 그만큼 돌려야 하므로 노출해도 무방하다.
  return ok({ steps });
}
