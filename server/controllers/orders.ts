/**
 * Orders controller — CRUD operations for client orders.
 */

import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

/**
 * GET /api/orders
 * Returns all orders, sorted by orderDate descending.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await query('SELECT * FROM orders ORDER BY "orderDate" DESC');
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
router.post('/', async (req: Request, res: Response) => {
  try {
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

    await query(
      `INSERT INTO orders (id, "clientName", contact, "orderDate", "dueDate", "totalOrderPrice", "totalDepositPaid", "paymentStatus", notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes || '']
    );

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
router.put('/:id', async (req: Request, res: Response) => {
  try {
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

    await query(
      `UPDATE orders 
       SET "clientName" = $1, contact = $2, "orderDate" = $3, "dueDate" = $4, 
           "totalOrderPrice" = $5, "totalDepositPaid" = $6, "paymentStatus" = $7, notes = $8
       WHERE id = $9`,
      [clientName, contact, orderDate, dueDate, totalOrderPrice, totalDepositPaid, paymentStatus, notes || '', id]
    );

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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete associated garments first (though CONSTRAINT should handle it, we'll be explicit)
    await query('DELETE FROM garments WHERE "orderId" = $1', [id]);
    // Delete the order
    await query('DELETE FROM orders WHERE id = $1', [id]);

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
