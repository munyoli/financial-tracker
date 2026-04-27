/**
 * Expenses controller — CRUD operations for expenses tracking.
 */

import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';

const router = Router();

/**
 * GET /api/expenses
 * Returns all expenses, sorted by paymentDate descending.
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM expenses ORDER BY paymentDate DESC');
    const rows: any[] = [];

    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

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
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      id,
      category,
      description,
      amount,
      paymentDate,
    } = req.body;

    db.run(
      `INSERT INTO expenses (id, category, description, amount, paymentDate)
       VALUES (?, ?, ?, ?, ?)`,
      [id, category, description, amount, paymentDate]
    );

    saveDatabase();
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
router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      category,
      description,
      amount,
      paymentDate,
    } = req.body;

    db.run(
      `UPDATE expenses 
       SET category = ?, description = ?, amount = ?, paymentDate = ?
       WHERE id = ?`,
      [category, description, amount, paymentDate, id]
    );

    saveDatabase();
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
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    db.run('DELETE FROM expenses WHERE id = ?', [id]);

    saveDatabase();
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
