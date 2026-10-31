/*
 * env.ts
 * Loads and validates environment variables from the project .env file, providing
 * typed defaults for every config value used across the backend.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '4000'), 10),

  finanvo: {
    baseUrl: optional('FINANVO_BASE_URL', 'https://api5.finanvo.in'),
    email: optional('FINANVO_EMAIL', ''),
    password: optional('FINANVO_PASSWORD', ''),
    tokenPath: optional('FINANVO_TOKEN_PATH', 'data.token'), // dot-notation path to JWT in login response
    timeoutMs: parseInt(optional('FINANVO_TIMEOUT_MS', '30000'), 10),
  },

  jwt: {
    secret: optional('JWT_SECRET', 'dev-secret-change-me'), // Electron overrides this with a per-install random secret
    expiresIn: optional('JWT_EXPIRES_IN', '8h'),
  },

  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
  downloadsDir: optional('DOWNLOADS_DIR', './downloads'),
  dbPath: optional('DB_PATH', './data/db.json'), // flat-file JSON store for sessions, orders, downloads
  downloadConcurrency: parseInt(optional('DOWNLOAD_CONCURRENCY', '3'), 10),
  debugApi: optional('DEBUG_API', 'false') === 'true', // enables per-request Finanvo API logging
} as const;

export type Env = typeof env;
