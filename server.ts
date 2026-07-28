import express from 'express';
import path from 'path';
import cors from 'cors';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';

import apiApp from './api/index.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use the shared API routes
  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using Vite middleware in development mode...');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    const serveIndex = async (req: any, res: any, next: any) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    };

    app.get('/', serveIndex);
    app.get('*all', serveIndex);
  } else {
    console.log('Serving static files from dist in production mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express 5 catch-all using *all or (.*)
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error sending index.html:', err);
          res.status(500).send('Production assets missing. Please run build.');
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Prevent server from sleeping when idle (useful for free hosting tiers like Render)
    const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        // Use environment variable for host if deployed, otherwise localhost
        const host = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || `http://localhost:${PORT}`;
        const url = `${host.replace(/\/$/, '')}/api/health`;
        console.log(`[Keep-Alive] Pinging ${url} to prevent sleep...`);
        await fetch(url);
      } catch (err: any) {
        console.error('[Keep-Alive] Ping failed:', err.message);
      }
    }, KEEP_ALIVE_INTERVAL);
  });
}

// Global error handlers to prevent the server from crashing due to unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
