import { q } from '@/lib/db';
import { DEFAULT_CODE_MAP } from '@/lib/spots';

const KEY = 'code_map';

// 관리툴에서 저장한 코드 지도를 읽는다. 저장한 적이 없으면 기본값을 돌려준다.
export async function readCodeMap() {
  const [row] = await q('SELECT value FROM page_content WHERE name=?', [KEY]);
  if (!row) return DEFAULT_CODE_MAP;
  try { return JSON.parse(row.value); }
  catch { return DEFAULT_CODE_MAP; }   // 값이 깨져도 화면은 뜨게 둔다
}

export async function writeCodeMap(map) {
  const value = JSON.stringify(map);
  await q('INSERT INTO page_content (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?',
          [KEY, value, value]);
}
