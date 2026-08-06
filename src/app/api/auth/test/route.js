import { q } from '@/lib/db';
import { signToken, ok, bad } from '@/lib/auth';

// POST /api/auth/test — 소셜 로그인 없이 통과하는 테스트용 계정 로그인.
// uuid 고정이라 항상 같은 계정을 재사용한다(uq_uuid).
const TEST_UUID = '00000000-0000-0000-0000-000000000001';

export async function POST() {
  console.log('[auth/test] 시작 — DB_HOST:', process.env.DB_HOST ? '설정됨' : '없음',
    '/ JWT_SECRET:', process.env.JWT_SECRET ? '설정됨' : '없음');
  try {
    await q(
      `INSERT INTO users (uuid, provider, provider_id, nickname) VALUES (?, 'test', 'tester', '테스터')
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [TEST_UUID]
    );
    const rows = await q('SELECT id, uuid, nickname, total_points FROM users WHERE uuid=?', [TEST_UUID]);
    const { uuid, ...user } = rows[0];
    console.log('[auth/test] 성공 — userId:', user.id, 'uuid:', uuid);
    return ok({ uuid, token: signToken({ id: user.id, role: 'user' }), user });
  } catch (e) {
    console.error('[auth/test] 실패:', e.code, e.message);
    return bad(`테스트 로그인 실패: ${e.code || ''} ${e.message}`, 500);
  }
}
