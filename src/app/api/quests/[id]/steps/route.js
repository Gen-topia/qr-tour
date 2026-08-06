import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();
  const { id } = await params;
  const steps = await q(
    'SELECT id, step_no, type, title, body_text, image_url, audio_url, hint_text, question, options FROM quest_steps WHERE quest_id=? ORDER BY step_no ASC',
    [id]
  );
  return ok({ steps }); // answer 컬럼 미포함
}
