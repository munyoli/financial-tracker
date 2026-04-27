/**
 * Database setup and initialization using pg (PostgreSQL).
 * Connects to Supabase.
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Initialize the PostgreSQL database.
 * Creates tables if they don't exist.
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        clientName TEXT NOT NULL,
        contact TEXT NOT NULL,
        orderDate TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        totalOrderPrice REAL NOT NULL DEFAULT 0,
        totalDepositPaid REAL NOT NULL DEFAULT 0,
        paymentStatus TEXT NOT NULL DEFAULT 'Deposit',
        notes TEXT DEFAULT ''
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS garments (
        id TEXT PRIMARY KEY,
        "orderId" TEXT,
        "clientName" TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        complexity TEXT NOT NULL DEFAULT 'Medium',
        "sellingPrice" REAL NOT NULL DEFAULT 0,
        "fabricCost" REAL NOT NULL DEFAULT 0,
        "otherMaterialsCost" REAL NOT NULL DEFAULT 0,
        "laborCost" REAL NOT NULL DEFAULT 0,
        "overheadAllocation" REAL NOT NULL DEFAULT 0,
        "estimatedHours" REAL,
        "actualHours" REAL,
        "startDate" TEXT NOT NULL,
        "dueDate" TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Not Started',
        CONSTRAINT fk_order FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE SET NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        paymentDate TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL
      )
    `);

    // Seed Default Admin if table is empty
    const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(rows[0].count);

    if (count === 0) {
      const adminHash = bcrypt.hashSync('password123', 10);
      await client.query(
        'INSERT INTO users (id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)',
        ['USR-ADMIN001', 'admin@atelier.com', adminHash, 'ADMIN', 'Atelier Admin']
      );
      console.log('✅ Default ADMIN user created (admin@atelier.com / password123)');
    }

    console.log('✅ Supabase PostgreSQL Database initialized');
  } finally {
    client.release();
  }
}

/**
 * Helper to run queries.
 */
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

/**
 * Mock saveDatabase for compatibility (Postgres auto-saves).
 */
export function saveDatabase(): void {
  // No-op for Postgres
}

/**
 * Get the pool instance (if needed for direct access).
 */
export function getDb() {
  return pool;
}
