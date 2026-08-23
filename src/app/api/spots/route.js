import { verifyFrom, ok, unauthorized } from '@/lib/auth';
import { readCodeMap } from '@/lib/codeMap';

// 참가자 화면(파수꾼 코드 지도)이 쓰는 내용
export async function GET(request) {
  if (!verifyFrom(request, 'user')) return unauthorized();
  return ok({ map: await readCodeMap() });
}
