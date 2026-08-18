import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  return ok({ steps: await q('SELECT * FROM quest_steps WHERE quest_id=? ORDER BY step_no ASC', [id]) });
}

export async function PUT(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const steps = Array.isArray(body?.steps) ? body.steps : [];
  await q('DELETE FROM quest_steps WHERE quest_id=?', [id]);
  let n = 1;
  for (const s of steps) {
    await q(
      `INSERT INTO quest_steps (quest_id, step_no, type, title, body_text, image_url, audio_url, hint_text, hint_image_url, question, options, answer, config)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, n++, s.type || 'story', s.title || null, s.body_text || null, s.image_url || null,
       s.audio_url || null, s.hint_text || null, s.hint_image_url || null, s.question || null,
       s.options ? JSON.stringify(s.options) : null, s.answer || null,
       s.config ? JSON.stringify(s.config) : null]);
  }
  return ok({ ok: true, count: steps.length });
}
