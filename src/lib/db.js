import mysql from 'mysql2/promise';

// 서버리스에서 인스턴스가 재사용될 때 풀도 재사용 (전역 싱글톤)
const g = globalThis;

export const pool = g.__qrtourPool || mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 5), // 서버리스는 낮게
  // AWS RDS는 SSL 권장. rejectUnauthorized:false 로 RDS 기본 인증서 허용.
  ssl: process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
  enableKeepAlive: true,
});
if (!g.__qrtourPool) g.__qrtourPool = pool;

// 헬퍼: rows만 반환 (INSERT는 ResultSetHeader 반환 → insertId 사용)
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
