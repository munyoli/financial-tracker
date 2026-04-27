/**
 * Garments controller — CRUD operations for garment tracking.
 */

import { Router, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/garments
 * Returns all garments, sorted by dueDate ascending.
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM garments ORDER BY dueDate ASC');
    const rows: any[] = [];
    const isStaff = req.user?.role === 'STAFF';

    while (stmt.step()) {
      const garment = stmt.getAsObject();
      if (isStaff) {
        // Redact financial data for STAFF
        garment.sellingPrice = 0;
        garment.fabricCost = 0;
        garment.otherMaterialsCost = 0;
        garment.laborCost = 0;
        garment.overheadAllocation = 0;
      }
      rows.push(garment);
    }
    stmt.free();

    res.json(rows);
  } catch (err) {
    console.error('Error fetching garments:', err);
    res.status(500).json({ error: 'Failed to fetch garments' });
  }
});

/**
 * POST /api/garments
 * Create a new garment. (ADMIN ONLY)
 */
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const {
      id,
      orderId,
      clientName,
      type,
      description,
      complexity,
      sellingPrice,
      fabricCost,
      otherMaterialsCost,
      laborCost,
      overheadAllocation,
      startDate,
      dueDate,
      status,
    } = req.body;

    db.run(
      `INSERT INTO garments (id, orderId, clientName, type, description, complexity, sellingPrice, fabricCost, otherMaterialsCost, laborCost, overheadAllocation, startDate, dueDate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, orderId, clientName, type, description, complexity, sellingPrice, fabricCost, otherMaterialsCost, laborCost, overheadAllocation || 0, startDate, dueDate, status]
    );

    saveDatabase();
    res.status(201).json(req.body);
  } catch (err) {
    console.error('Error creating garment:', err);
    res.status(500).json({ error: 'Failed to create garment' });
  }
});

/**
 * PUT /api/garments/:id
 * Update an existing garment.
 */
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const isStaff = req.user?.role === 'STAFF';

    const {
      orderId,
      clientName,
      type,
      description,
      complexity,
      sellingPrice,
      fabricCost,
      otherMaterialsCost,
      laborCost,
      overheadAllocation,
      startDate,
      dueDate,
      status,
    } = req.body;

    if (isStaff) {
      // IF STAFF: ONLY UPDATE STATUS. Ignore all other fields to prevent wiping costs.
      db.run(
        `UPDATE garments SET status = ? WHERE id = ?`,
        [status, id]
      );
    } else {
      // IF ADMIN: Update everything
      db.run(
        `UPDATE garments 
         SET orderId = ?, clientName = ?, type = ?, description = ?, complexity = ?,
             sellingPrice = ?, fabricCost = ?, otherMaterialsCost = ?, laborCost = ?,
             overheadAllocation = ?, startDate = ?, dueDate = ?, status = ?
         WHERE id = ?`,
        [orderId, clientName, type, description, complexity, sellingPrice, fabricCost, otherMaterialsCost, laborCost, overheadAllocation || 0, startDate, dueDate, status, id]
      );
    }

    saveDatabase();
    res.json({ id, ...req.body });
  } catch (err) {
    console.error('Error updating garment:', err);
    res.status(500).json({ error: 'Failed to update garment' });
  }
});

/**
 * DELETE /api/garments/:id
 * Delete a garment. (ADMIN ONLY)
 */
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    db.run('DELETE FROM garments WHERE id = ?', [id]);

    saveDatabase();
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting garment:', err);
    res.status(500).json({ error: 'Failed to delete garment' });
  }
});

export default router;
