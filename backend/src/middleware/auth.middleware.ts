/*
 * auth.middleware.ts
 * JWT authentication middleware: extracts the token from the Authorization header
 * or mca_session cookie, verifies it, looks up the stored session, and injects the
 * Finanvo token and session metadata onto the request object.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { error } from '../utils/response';
import { getSession } from '../services/db.service';

export interface SessionPayload {
  sessionId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      sessionEmail?: string;
      finanvoToken?: string; // the raw Finanvo JWT extracted from the session store
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7) // strip "Bearer " prefix
    : (req.cookies?.mca_session as string | undefined); // fall back to httpOnly cookie

  if (!token) {
    error(res, 'Authentication required', 401);
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret) as SessionPayload;
    const session = getSession(payload.sessionId);

    if (!session) {
      error(res, 'Session expired or invalid. Please log in again.', 401);
      return;
    }

    req.sessionId = payload.sessionId;
    req.sessionEmail = payload.email;
    req.finanvoToken = session.finanvoToken;
    next();
  } catch {
    error(res, 'Invalid or expired token', 401);
  }
}
