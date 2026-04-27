import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDatabase } from '../db.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * All user management routes require Admin privileges
 */
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/users
 * Returns list of team members (excluding their password hashes)
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT id, email, name, role FROM users');
    const users: any[] = [];
    
    while (stmt.step()) {
      users.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/users
 * Add a new user (admin only)
 */
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'ADMIN' && role !== 'STAFF') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const db = getDb();

    // Check if email already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    checkStmt.bind([email]);
    if (checkStmt.step()) {
      checkStmt.free();
      return res.status(400).json({ error: 'Email already exists' });
    }
    checkStmt.free();

    const id = `USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const password_hash = bcrypt.hashSync(password, 10);

    db.run(
      'INSERT INTO users (id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
      [id, email, password_hash, role, name]
    );

    saveDatabase();
    res.status(201).json({ id, name, email, role });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * DELETE /api/users/:id
 * Remove a user
 */
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    const db = getDb();
    db.run('DELETE FROM users WHERE id = ?', [id]);
    saveDatabase();
    
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
