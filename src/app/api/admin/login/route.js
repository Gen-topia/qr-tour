import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { signToken, ok, unauthorized } from '@/lib/auth';

export async function POST(request) {
  const { username, password } = await request.json().catch(() => ({}));
  const [a] = await q('SELECT * FROM admins WHERE username=?', [username]);
  if (!a || !(await bcrypt.compare(password || '', a.password_hash)))
    return unauthorized('아이디 또는 비밀번호가 올바르지 않습니다.');
  return ok({ token: signToken({ id: a.id, role: 'admin', username: a.username }) });
}
