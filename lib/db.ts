import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true, // Required to execute entire init.sql script
});

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  try {
    const filePath = path.join(process.cwd(), 'sql', 'init.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    const connection = await pool.getConnection();
    await connection.query(sql);
    connection.release();

    isInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

export default pool;    