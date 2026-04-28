/**
 * Server entry point — Express app with SQLite persistence.
 * Runs on port 5000 by default.
 */

import express from 'express';
import fs from 'fs';
import { initDatabase } from './db.js';
import { registerRoutes } from './routes.js';

import path from 'path';

const PORT = process.env.PORT || 5000;

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
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Register API routes
  registerRoutes(app);

  // Serve static files in production
  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
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
  }

  // Start server - Listening on 0.0.0.0 to allow network access
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on all interfaces at port ${PORT}`);
    console.log(`📡 Local:   http://localhost:${PORT}`);
    console.log(`📡 Network: http://192.168.0.102:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
