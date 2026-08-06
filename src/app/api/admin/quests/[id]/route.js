import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function PUT(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  await q('UPDATE quests SET title=?, order_no=?, cover_image_url=?, reward_points=?, is_active=? WHERE id=?',
    [b.title, b.order_no || 0, b.cover_image_url || null, b.reward_points ?? 100, b.is_active ?? 1, id]);
  return ok({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  await q('DELETE FROM quests WHERE id=?', [id]);
  return ok({ ok: true });
}
