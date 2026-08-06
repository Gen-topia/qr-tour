import { q } from '@/lib/db';
import { signToken, ok } from '@/lib/auth';

// POST /api/auth/test — 소셜 로그인 없이 통과하는 테스트용 계정 로그인.
// uuid 고정이라 항상 같은 계정을 재사용한다(uq_uuid).
const TEST_UUID = '00000000-0000-0000-0000-000000000001';

export async function POST() {
  await q(
    `INSERT INTO users (uuid, nickname) VALUES (?, '테스터')
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [TEST_UUID]
  );
  const rows = await q('SELECT id, uuid, nickname, total_points FROM users WHERE uuid=?', [TEST_UUID]);
  const { uuid, ...user } = rows[0];
  return ok({ uuid, token: signToken({ id: user.id, role: 'user' }), user });
}
