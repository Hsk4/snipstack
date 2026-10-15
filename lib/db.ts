import mysql, { type RowDataPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { connection as requestConnection } from 'next/server';

const dbName = process.env.DB_NAME ?? 'snippet_vault';

const poolConfig = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 10, queueLimit: 0, multipleStatements: true }
  : {
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    };

const pool = mysql.createPool(poolConfig);

let isInitialized = false;

async function ensureDatabaseExists() {
  if (process.env.DATABASE_URL) return;

  const { host, port, user, password } = poolConfig as {
    host: string;
    port: number;
    user: string;
    password: string;
  };

  const bootstrap = await mysql.createConnection({ host, port, user, password });
  try {
    const [rows] = await bootstrap.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    const exists = Number(rows[0]?.cnt) > 0;
    if (!exists) {
      await bootstrap.query(`CREATE DATABASE \`${dbName}\``);
    }
  } finally {
    await bootstrap.end();
  }
}

export async function initDb() {
  await requestConnection();

  if (isInitialized) return;

  await ensureDatabaseExists();

  const filePath = path.join(process.cwd(), 'lib', 'sql', 'init.sql');
  const sql = fs.readFileSync(filePath, 'utf8');

  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
    isInitialized = true;
    console.log('Database initialized successfully');
  } finally {
    connection.release();
  }
}

export default pool;
