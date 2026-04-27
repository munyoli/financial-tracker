/**
 * Server entry point — Express app with SQLite persistence.
 * Runs on port 5000 by default.
 */

import express from 'express';
import { initDatabase } from './db.js';
import { registerRoutes } from './routes.js';

const PORT = process.env.SERVER_PORT || 5000;

async function main() {
  // Initialize database first
  await initDatabase();

  const app = express();

  // Middleware
  app.use(express.json());

  // CORS headers for development
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Register API routes
  registerRoutes(app);

  // Fallback route for backend root
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center;">
        <h2>Atelier Backend API is Running</h2>
        <p>This is the API server. To view the application, please visit:</p>
        <a href="http://localhost:3000" style="font-size: 1.2rem; color: #4b352d; font-weight: bold;">http://localhost:3000</a>
      </div>
    `);
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET/POST       /api/orders`);
    console.log(`   PUT/DELETE      /api/orders/:id`);
    console.log(`   GET/POST       /api/garments`);
    console.log(`   PUT/DELETE      /api/garments/:id`);
    console.log(`   GET            /api/health`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
