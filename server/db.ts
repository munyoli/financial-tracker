/**
 * Database setup and initialization using sql.js (pure JS SQLite).
 * Data is persisted to ./data/tracker.db
 */

import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'tracker.db');

let db: Database;

/**
 * Initialize the SQLite database.
 * Creates the data directory and database file if they don't exist.
 * Runs schema migrations on first launch.
 */
export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if they don't exist
  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS garments (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      clientName TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      complexity TEXT NOT NULL DEFAULT 'Medium',
      sellingPrice REAL NOT NULL DEFAULT 0,
      fabricCost REAL NOT NULL DEFAULT 0,
      otherMaterialsCost REAL NOT NULL DEFAULT 0,
      laborCost REAL NOT NULL DEFAULT 0,
      overheadAllocation REAL NOT NULL DEFAULT 0,
      estimatedHours REAL,
      actualHours REAL,
      startDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Not Started',
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Migrate old data
  try {
    db.run(`ALTER TABLE garments ADD COLUMN estimatedHours REAL;`);
  } catch (e) {
    // Column might already exist
  }
  try {
    db.run(`ALTER TABLE garments ADD COLUMN actualHours REAL;`);
  } catch (e) {
    // Column might already exist
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);
  
  // Seed Default Admin if table is empty
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  stmt.step();
  const { count } = stmt.getAsObject() as unknown as { count: number };
  stmt.free();

  if (count === 0) {
    const adminHash = bcrypt.hashSync('password123', 10);
    db.run(
      `INSERT INTO users (id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)`,
      ['USR-ADMIN001', 'admin@atelier.com', adminHash, 'ADMIN', 'Atelier Admin']
    );
    console.log('✅ Default ADMIN user created (admin@atelier.com / password123)');
  }

  // Enable WAL mode for better concurrent read performance
  db.run('PRAGMA journal_mode=WAL');

  // Persist to disk
  saveDatabase();

  console.log('✅ Database initialized at', DB_PATH);
  return db;
}

/**
 * Save the current in-memory database state to disk.
 */
export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Get the current database instance.
 */
export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
