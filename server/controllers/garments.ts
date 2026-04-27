/**
 * Garments controller — CRUD operations for garment tracking.
 */

import { Router, Response } from 'express';
import { query } from '../db.js';
import { AuthRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/garments
 * Returns all garments, sorted by dueDate ascending.
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM garments ORDER BY "dueDate" ASC');
    const isStaff = req.user?.role === 'STAFF';

    const garments = rows.map(garment => {
      if (isStaff) {
        // Redact financial data for STAFF
        return {
          ...garment,
          sellingPrice: 0,
          fabricCost: 0,
          otherMaterialsCost: 0,
          laborCost: 0,
          overheadAllocation: 0,
        };
      }
      return garment;
    });

    res.json(garments);
  } catch (err) {
    console.error('Error fetching garments:', err);
    res.status(500).json({ error: 'Failed to fetch garments' });
  }
});

/**
 * POST /api/garments
 * Create a new garment. (ADMIN ONLY)
 */
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
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

    await query(
      `INSERT INTO garments (id, "orderId", "clientName", type, description, complexity, "sellingPrice", "fabricCost", "otherMaterialsCost", "laborCost", "overheadAllocation", "startDate", "dueDate", status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, orderId, clientName, type, description, complexity, sellingPrice, fabricCost, otherMaterialsCost, laborCost, overheadAllocation || 0, startDate, dueDate, status]
    );

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
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
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
      // IF STAFF: ONLY UPDATE STATUS.
      await query(
        'UPDATE garments SET status = $1 WHERE id = $2',
        [status, id]
      );
    } else {
      // IF ADMIN: Update everything
      await query(
        `UPDATE garments 
         SET "orderId" = $1, "clientName" = $2, type = $3, description = $4, complexity = $5,
             "sellingPrice" = $6, "fabricCost" = $7, "otherMaterialsCost" = $8, "laborCost" = $9,
             "overheadAllocation" = $10, "startDate" = $11, "dueDate" = $12, status = $13
         WHERE id = $14`,
        [orderId, clientName, type, description, complexity, sellingPrice, fabricCost, otherMaterialsCost, laborCost, overheadAllocation || 0, startDate, dueDate, status, id]
      );
    }

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
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM garments WHERE id = $1', [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting garment:', err);
    res.status(500).json({ error: 'Failed to delete garment' });
  }
});

export default router;
