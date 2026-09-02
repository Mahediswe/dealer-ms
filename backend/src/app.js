import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import dealerRoutes from './routes/dealers.routes.js';
import productRoutes from './routes/products.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import salesRoutes from './routes/sales.routes.js';
import purchaseRoutes from './routes/purchases.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import accountRoutes from './routes/accounts.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/reports.routes.js';
import salesmenRoutes from './routes/salesmen.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import masterRoutes from './routes/masters.routes.js';
import returnsRoutes from './routes/returns.routes.js';
import searchRoutes from './routes/search.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import branchesRoutes from './routes/branches.routes.js';

dotenv.config();

/**
 * Builds and returns the configured Express app, with no `.listen()` call.
 * - `server.js` wraps this with an HTTP server + Socket.IO for local dev and
 *   traditional hosts (Railway, Render, a VPS, etc.) where the process stays
 *   alive and real-time notifications work.
 * - `api/index.js` exports this directly for Vercel's serverless functions.
 *   Serverless requests are stateless/short-lived, so Socket.IO can't persist
 *   a connection there — real-time notifications are skipped in that mode
 *   (routes call `req.app.get('io')`, which is simply `undefined` on Vercel,
 *   and `utils/notify.js` already no-ops safely when `io` isn't set).
 */
export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'dms-backend', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/dealers', dealerRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/purchases', purchaseRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/salesmen', salesmenRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/masters', masterRoutes);
  app.use('/api/returns', returnsRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/branches', branchesRoutes);

  // 404
  app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
