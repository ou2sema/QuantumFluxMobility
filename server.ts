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

  // Initialize secure credentials and migrate any legacy plaintext PINs
  try {
    await initDefaultCredentials();
    const migration = await migrateLegacyPlaintextPins();
    if (migration.migratedCount > 0) {
      console.log(`[Security] Migrated ${migration.migratedCount} legacy accounts to secure hashed credentials.`);
    }
  } catch (err) {
    console.warn('[Security] Warning during startup auth initialization:', err);
  }

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
