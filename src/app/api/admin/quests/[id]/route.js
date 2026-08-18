import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function PUT(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  await q('UPDATE quests SET title=?, order_no=?, quest_group=?, main_no=?, main_title=?, place=?, cover_image_url=?, narration_video=?, clear_text=?, clear_audio_url=?, reward_points=?, is_active=? WHERE id=?',
    [b.title, b.order_no || 0, b.quest_group ?? 1, b.main_no ?? 1, b.main_title || null, b.place || null, b.cover_image_url || null, b.narration_video || null, b.clear_text || null, b.clear_audio_url || null, b.reward_points ?? 100, b.is_active ?? 1, id]);
  return ok({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  await q('DELETE FROM quests WHERE id=?', [id]);
  return ok({ ok: true });
}
