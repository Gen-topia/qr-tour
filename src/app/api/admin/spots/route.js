import { verifyFrom, ok, bad, unauthorized } from '@/lib/auth';
import { readCodeMap, writeCodeMap } from '@/lib/codeMap';

export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  return ok({ map: await readCodeMap() });
}

export async function PUT(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const b = await request.json().catch(() => ({}));
  const map = b.map;
  if (!map || !Array.isArray(map.groups)) return bad('지도 내용 형식이 올바르지 않습니다.');
  await writeCodeMap({
    lead: String(map.lead || ''),
    image: String(map.image || ''),
    groups: map.groups.map(g => ({
      group: String(g.group || ''),
      items: (g.items || []).map(s => ({
        code: String(s.code || ''), name: String(s.name || ''),
        sub: s.sub || '', address: s.address || '', map: s.map || '',
        hours: s.hours || '', tel: s.tel || '',
        notes: (s.notes || []).filter(Boolean),
        ...(s.link?.url ? { link: { label: s.link.label || '자세히 보기', url: s.link.url } } : {}),
      })),
    })),
  });
  return ok({ map: await readCodeMap() });
}
