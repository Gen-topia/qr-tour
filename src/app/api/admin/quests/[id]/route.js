import { q } from '@/lib/db';
import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';

export async function PUT(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  const b = await request.json().catch(() => ({}));

  // QR 코드는 접속 주소(/q/{code})라서 고치면 이미 인쇄한 QR이 이 퀘스트를 열지 못한다.
  const code = String(b.code ?? '').trim().toUpperCase();
  if (!code) return bad('QR 코드를 입력해 주세요.');
  const [dup] = await q('SELECT id FROM quests WHERE code=? AND id<>?', [code, id]);
  if (dup) return bad(`이미 다른 미션이 쓰고 있는 QR 코드입니다: ${code}`);

  await q('UPDATE quests SET code=?, title=?, header_title=?, order_no=?, quest_group=?, main_no=?, main_title=?, place=?, cover_image_url=?, clear_image_url=?, narration_video=?, clear_text=?, clear_audio_url=?, reward_points=?, is_active=? WHERE id=?',
    [code, b.title, b.header_title || null, b.order_no || 0, b.quest_group ?? 1, b.main_no ?? 1, b.main_title || null, b.place || null, b.cover_image_url || null, b.clear_image_url || null, b.narration_video || null, b.clear_text || null, b.clear_audio_url || null, b.reward_points ?? 100, b.is_active ?? 1, id]);
  return ok({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const { id } = await params;
  await q('DELETE FROM quests WHERE id=?', [id]);
  return ok({ ok: true });
}
