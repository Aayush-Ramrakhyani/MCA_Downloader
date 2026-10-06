import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalErrorHandler } from './middleware/errorHandler';
import { INTEGRATION_STATUS } from './services/finanvo/types';

import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import documentRoutes from './routes/document.routes';
import orderRoutes from './routes/order.routes';
import downloadRoutes from './routes/download.routes';
import accountRoutes from './routes/account.routes';

const app = express();
const isProduction = env.nodeEnv === 'production';

// In production (Electron), serve the built React frontend
const frontendDistPath = isProduction
  ? path.join((process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ?? '', 'frontend', 'dist')
  : null;

if (isProduction && frontendDistPath && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  logger.info(`Serving frontend from ${frontendDistPath}`);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: () => env.nodeEnv === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ─── Health & Status ─────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'MCA Document Downloader API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/integration-status', (_req, res) => {
  res.json({ success: true, data: INTEGRATION_STATUS });
});

// ─── Routes ───────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/companies', documentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/downloads', downloadRoutes);

// ─── 404 / SPA fallback ──────────────────────────────────────

app.use((req, res) => {
  // In production, unknown non-API routes serve index.html for React Router
  if (isProduction && frontendDistPath && !req.path.startsWith('/api')) {
    const index = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(index)) { res.sendFile(path.resolve(index)); return; }
  }
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Error handler ────────────────────────────────────────────

app.use(globalErrorHandler);

export default app;
