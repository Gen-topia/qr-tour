import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const [row] = await q("SELECT value FROM settings WHERE name='quest_open'");
  return ok({ questOpen: row ? row.value === '1' : true });
}

// 0이면 참가자에게 '이용 가능한 기간이 아닙니다' 안내가 나가고 더 진행되지 않는다.
export async function PUT(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const b = await request.json().catch(() => ({}));
  const value = b.questOpen ? '1' : '0';
  await q(
    "INSERT INTO settings (name, value) VALUES ('quest_open', ?) ON DUPLICATE KEY UPDATE value=?",
    [value, value]
  );
  return ok({ questOpen: value === '1' });
}
