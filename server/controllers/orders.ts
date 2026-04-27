/**
 * Orders controller — CRUD operations for client orders.
 */

import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';

const router = Router();

/**
 * GET /api/orders
 * Returns all orders, sorted by orderDate descending.
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM orders ORDER BY orderDate DESC');
    const rows: any[] = [];

    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/orders
 * Create a new order.
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      id,
      clientName,
      contact,
      orderDate,
      dueDate,
      totalOrderPrice,
      totalDepositPaid,
      paymentStatus,
      notes,
    } = req.body;

    db.run(
      `INSERT INTO orders (id, clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes || '']
    );

    saveDatabase();
    res.status(201).json({ id, clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * PUT /api/orders/:id
 * Update an existing order.
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      clientName,
      contact,
      orderDate,
      dueDate,
      totalOrderPrice,
      totalDepositPaid,
      paymentStatus,
      notes,
    } = req.body;

    db.run(
      `UPDATE orders 
       SET clientName = ?, contact = ?, orderDate = ?, dueDate = ?, 
           totalOrderPrice = ?, totalDepositPaid = ?, paymentStatus = ?, notes = ?
       WHERE id = ?`,
      [clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes || '', id]
    );

    saveDatabase();
    res.json({ id, clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete an order and all its associated garments (cascade).
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Delete associated garments first
    db.run('DELETE FROM garments WHERE orderId = ?', [id]);
    // Delete the order
    db.run('DELETE FROM orders WHERE id = ?', [id]);

    saveDatabase();
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
