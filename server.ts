import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './server/routes.ts';
import { initSocketIO } from './server/socket.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Initialize Socket.io WebSockets
  initSocketIO(httpServer);

  app.use(cors());
  app.use(express.json());

  // Mount API router under /api as well as direct paths with HTML fallback protection
  app.use('/api', apiRouter);
  app.use((req, res, next) => {
    // If browser is requesting an HTML page (like /dashboard, /projects/prj-1), pass through to frontend
    if (req.method === 'GET' && req.accepts('html') && !req.headers.authorization && !req.path.startsWith('/api')) {
      return next();
    }
    return apiRouter(req, res, next);
  });

  // Serve generated assets and images
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Planify Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
