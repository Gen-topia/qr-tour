import ExcelJS from 'exceljs';
import { q } from '@/lib/db';
import { verifyFrom, unauthorized } from '@/lib/auth';

// 참가자 목록을 엑셀 파일(.xlsx)로 내려준다 — 화면의 표와 같은 열에,
// 뒤로 미션마다 두 칸씩 붙여 수행 여부(O·X)와 완료 시각을 적는다.
// 전화번호처럼 0으로 시작하는 값은 xlsx가 글자 유형을 함께 담으므로 앞자리가 떨어지지 않는다.
const COLUMNS = [
  { header: 'ID', key: 'id', width: 6 },
  { header: 'UUID', key: 'uuid', width: 38 },
  { header: '닉네임', key: 'nickname', width: 14 },
  { header: '이메일', key: 'email', width: 26 },
  { header: '전화번호', key: 'phone', width: 16 },
  { header: '누적점수', key: 'total_points', width: 10 },
  { header: '완료 미션', key: 'cleared_count', width: 10 },
  { header: '가입일', key: 'created_at', width: 12 },
];

export async function GET(request) {
  if (!verifyFrom(request, 'admin')) return unauthorized();
  const users = await q(
    `SELECT u.id, u.uuid, u.nickname, u.email, u.phone, u.total_points,
            DATE_FORMAT(u.created_at, '%Y-%m-%d') AS created_at,
            (SELECT COUNT(*) FROM quest_progress p WHERE p.user_id=u.id AND p.status='cleared') AS cleared_count
     FROM users u ORDER BY u.id DESC`);
  const quests = await q(
    'SELECT id, title FROM quests WHERE is_active=1 ORDER BY order_no ASC');
  // 완료 시각은 DB에서 바로 글자로 만든다 — DB 시간대가 Asia/Seoul이라 그대로 우리 시각이다
  const done = await q(
    `SELECT user_id, quest_id, DATE_FORMAT(cleared_at, '%Y-%m-%d %H:%i') AS at
       FROM quest_progress WHERE status='cleared'`);
  const doneAt = new Map(done.map(r => [`${r.user_id}:${r.quest_id}`, r.at || '']));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('참가자');
  // 미션마다 '수행 여부'와 '완료 시각' 두 칸. 같은 이름이 있어도 열쇠(key)는 미션 번호라 섞이지 않는다.
  ws.columns = [...COLUMNS, ...quests.flatMap(qz => [
    { header: qz.title, key: `q${qz.id}`, width: 14 },
    { header: `${qz.title} 완료시각`, key: `t${qz.id}`, width: 17 },
  ])];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { wrapText: true, vertical: 'middle' };
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];   // 머리글과 ID 칸을 고정해 둔다
  for (const u of users) {
    const row = {
      ...u,
      nickname: u.nickname || '',
      email: u.email || '',
      phone: u.phone || '',
    };
    for (const qz of quests) {
      const at = doneAt.get(`${u.id}:${qz.id}`);
      row[`q${qz.id}`] = at === undefined ? 'X' : 'O';
      row[`t${qz.id}`] = at ?? '';
    }
    const added = ws.addRow(row);
    // O·X 칸은 가운데로 모아 한눈에 보이게 한다(그 옆 시각 칸은 그대로 왼쪽)
    for (let i = 0; i < quests.length; i++) {
      added.getCell(COLUMNS.length + 1 + i * 2).alignment = { horizontal: 'center' };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('참가자.xlsx')}`,
    },
  });
}
