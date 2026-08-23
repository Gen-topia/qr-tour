
import mysql from 'mysql2/promise';
const c = await mysql.createConnection({
  host: process.env.DB_HOST, port: +(process.env.DB_PORT||3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
const [rows] = await c.query(process.argv[2]);
console.log(JSON.stringify(rows, null, 1));
await c.end();
