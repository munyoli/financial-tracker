/**
 * Route registration — mounts all API controllers.
 */

import { Express } from 'express';
import ordersController from './controllers/orders.js';
import garmentsController from './controllers/garments.js';
import expensesController from './controllers/expenses.js';
import authController from './controllers/auth.js';
import usersController from './controllers/users.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';

export function registerRoutes(app: Express): void {
  // Public routes
  app.use('/api/auth', authController);

  // Authenticated routes
  app.use('/api/garments', requireAuth, garmentsController);
  
  // Admin only routes
  app.use('/api/orders', requireAuth, requireAdmin, ordersController);
  app.use('/api/expenses', requireAuth, requireAdmin, expensesController);
  app.use('/api/users', requireAuth, requireAdmin, usersController);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
