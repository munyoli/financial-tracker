/**
 * Expenses controller — CRUD operations for expenses tracking.
 */

import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

/**
 * GET /api/expenses
 * Returns all expenses, sorted by paymentDate descending.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM expenses ORDER BY "paymentDate" DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * POST /api/expenses
 * Create a new expense.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      id,
      category,
      description,
      amount,
      paymentDate,
    } = req.body;

    await query(
      `INSERT INTO expenses (id, category, description, amount, "paymentDate")
       VALUES ($1, $2, $3, $4, $5)`,
      [id, category, description, amount, paymentDate]
    );

    res.status(201).json(req.body);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

/**
 * PUT /api/expenses/:id
 * Update an existing expense.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category,
      description,
      amount,
      paymentDate,
    } = req.body;

    await query(
      `UPDATE expenses 
       SET category = $1, description = $2, amount = $3, "paymentDate" = $4
       WHERE id = $5`,
      [category, description, amount, paymentDate, id]
    );

    res.json({ id, ...req.body });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
