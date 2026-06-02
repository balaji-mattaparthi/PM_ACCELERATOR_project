/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDB } from './server/db';
import apiRouter from './server/api';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Initialize DB Connection (Mongoose or Fallback JSON file)
  await initDB();

  // 2. Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // 3. API Routes
  app.use('/api', apiRouter);

  // 4. Vite Assets or Production Static Bundles
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Start listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  Weather Server online on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
}

startServer().catch((error) => {
  console.error('Critical failure in weather bootstrap runner:', error);
  process.exit(1);
});
