import mysql from 'mysql2/promise';
import { config } from './config';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: config.db.connectTimeout,
  ...(config.db.ssl && { ssl: { rejectUnauthorized: false } }),
});

export async function query(sql: string, params?: any[]): Promise<any> {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
}

export async function queryOne(sql: string, params?: any[]): Promise<any> {
  const [rows] = await pool.execute(sql, params || []);
  return Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0] : null;
}

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback().catch(() => undefined);
    throw e;
  } finally {
    conn.release();
  }
}


