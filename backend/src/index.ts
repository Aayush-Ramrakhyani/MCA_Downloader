import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { loginWithEnvCredentials } from './services/finanvo/auth.service';
import fs from 'fs';
import path from 'path';

async function bootstrap(): Promise<void> {
  // Ensure downloads directory exists
  const downloadsPath = path.isAbsolute(env.downloadsDir)
    ? env.downloadsDir
    : path.resolve(process.cwd(), env.downloadsDir);
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  // Attempt auto-login with configured credentials (best-effort)
  try {
    await loginWithEnvCredentials();
  } catch (err: unknown) {
    logger.warn('Auto-login with env credentials failed — users must log in via UI', {
      error: (err as Error).message,
    });
  }

  app.listen(env.port, () => {
    logger.info(`MCA Document Downloader API listening on port ${env.port}`, {
      env: env.nodeEnv,
      finanvoBase: env.finanvo.baseUrl,
    });
  });
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
