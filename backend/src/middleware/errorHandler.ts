/*
 * errorHandler.ts
 * Global Express error-handling middleware: maps known MISSING_API errors to 501
 * responses and converts all other unhandled exceptions to 500 JSON responses.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { error } from '../utils/response';

const MISSING_API_PREFIX = 'MISSING_API_ENDPOINT:';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known "not yet implemented" errors get a clear 501
  if (err.message.startsWith(MISSING_API_PREFIX)) {
    logger.warn('Missing API endpoint called', { path: req.path, message: err.message });
    error(res, err.message, 501);
    return;
  }

  logger.error('Unhandled error', { path: req.path, error: err.message, stack: err.stack });
  error(res, 'Internal server error', 500);
}
