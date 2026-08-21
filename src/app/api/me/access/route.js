import { q } from '@/lib/db';
import { verifyFrom, ok, unauthorized } from '@/lib/auth';

// 지금 이 사람이 퀘스트를 진행해도 되는지 판정한다.
//   앱이 열려 있으면 누구나 통과.
//   닫혀 있으면 관리자가 등록해 둔 테스터 이메일만 통과한다.
export async function GET(request) {
  const user = verifyFrom(request, 'user');
  if (!user) return unauthorized();

  const [row] = await q("SELECT value FROM settings WHERE name='quest_open'");
  const questOpen = row ? row.value === '1' : true;
  if (questOpen) return ok({ allowed: true, questOpen });

  const [me] = await q('SELECT email FROM users WHERE id=?', [user.id]);
  const email = (me?.email || '').trim().toLowerCase();
  if (!email) return ok({ allowed: false, questOpen, reason: 'no-email' });

  const [tester] = await q('SELECT email FROM testers WHERE LOWER(email)=?', [email]);
  return ok({ allowed: !!tester, questOpen, reason: tester ? 'tester' : 'not-tester' });
}
