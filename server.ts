import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { initDefaultCredentials, migrateLegacyPlaintextPins } from './server/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Mount API Router FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen immediately on port 3000 so the dev proxy is active without delay
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Initialize secure credentials in background without delaying server startup
  initDefaultCredentials()
    .then(() => migrateLegacyPlaintextPins())
    .then((migration) => {
      if (migration && migration.migratedCount > 0) {
        console.log(`[Security] Migrated ${migration.migratedCount} legacy accounts to secure hashed credentials.`);
      }
    })
    .catch((err) => {
      console.warn('[Security] Warning during startup auth initialization:', err);
    });
}

startServer();
