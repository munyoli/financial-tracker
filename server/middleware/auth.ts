import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'atelier-super-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

/**
 * Middleware to ensure the user is authenticated via JWT.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user still exists in DB
    const db = getDb();
    const stmt = db.prepare('SELECT id, email, role, name FROM users WHERE id = ?');
    stmt.bind([decoded.id]);
    
    if (stmt.step()) {
      req.user = stmt.getAsObject() as unknown as AuthRequest['user'];
      stmt.free();
      return next();
    }
    
    stmt.free();
    return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * Middleware to ensure the authenticated user has the ADMIN role.
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
