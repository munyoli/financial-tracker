import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
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
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query('SELECT id, email, name, role FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/users
 * Add a new user (admin only)
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'ADMIN' && role !== 'STAFF') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email already exists
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const id = `USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const password_hash = bcrypt.hashSync(password, 10);

    await query(
      'INSERT INTO users (id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)',
      [id, email, password_hash, role, name]
    );

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
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
