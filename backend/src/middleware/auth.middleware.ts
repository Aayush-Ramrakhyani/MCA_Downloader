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
      finanvoToken?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.mca_session as string | undefined);

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
