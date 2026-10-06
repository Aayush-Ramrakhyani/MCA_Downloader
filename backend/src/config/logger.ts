import winston from 'winston';
import { env } from './env';

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'access_token', 'accessToken', 'authorization',
  'cookie', 'set-cookie', 'jwt', 'secret', 'apiKey', 'api_key',
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => sanitize(v, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : sanitize(value, depth + 1);
  }
  return result;
}

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? '\n' + JSON.stringify(sanitize(meta), null, 2)
            : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        }),
      ),
    }),
  ],
});

export function logApiCall(opts: {
  method: string;
  url: string;
  statusCode?: number;
  durationMs?: number;
  requestBody?: unknown;
  responseBody?: unknown;
}) {
  if (!env.debugApi) return;
  logger.debug('Finanvo API call', {
    method: opts.method,
    url: opts.url,
    statusCode: opts.statusCode,
    durationMs: opts.durationMs,
    requestBody: sanitize(opts.requestBody),
    responseBody: sanitize(opts.responseBody),
  });
}
