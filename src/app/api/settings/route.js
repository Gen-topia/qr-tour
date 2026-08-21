import { q } from '@/lib/db';
import { ok } from '@/lib/auth';

// 앱이 열려 있는지 — QR로 막 들어온 사람도 로그인 전에 확인해야 하므로 인증을 요구하지 않는다.
export async function GET() {
  const [row] = await q("SELECT value FROM settings WHERE name='quest_open'");
  return ok({ questOpen: row ? row.value === '1' : true });
}
