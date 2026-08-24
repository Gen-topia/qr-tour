import ExcelJS from 'exceljs';
import { q } from '@/lib/db';
import { verifyFrom, unauthorized } from '@/lib/auth';

// 참가자 목록을 엑셀 파일(.xlsx)로 내려준다 — 화면의 표와 같은 열·같은 순서.
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

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('참가자');
  ws.columns = COLUMNS;
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];   // 첫 줄(머리글)을 고정해 둔다
  for (const u of users) {
    ws.addRow({
      ...u,
      nickname: u.nickname || '',
      email: u.email || '',
      phone: u.phone || '',
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('참가자.xlsx')}`,
    },
  });
}
