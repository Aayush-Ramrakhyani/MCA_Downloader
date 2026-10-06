import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { loginToFinanvo, logoutFromFinanvo } from '../services/finanvo/auth.service';
import { saveSession, deleteSession } from '../services/db.service';
import { success, error } from '../utils/response';
import { env } from '../config/env';
import { logger } from '../config/logger';

const SESSION_MS = 8 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.nodeEnv === 'production',
  maxAge: SESSION_MS,
};

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    error(res, 'Email and password are required', 400);
    return;
  }

  try {
    const finanvoToken = await loginToFinanvo(email, password);
    const sessionId = uuidv4();
    const expiresAt = Date.now() + SESSION_MS;

    saveSession({ id: sessionId, finanvoToken, userEmail: email, createdAt: Date.now(), expiresAt });

    const jwt_token = jwt.sign({ sessionId, email }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });

    res.cookie('mca_session', jwt_token, COOKIE_OPTIONS);
    success(res, { token: jwt_token, email }, 'Login successful');
    logger.info(`User logged in: ${email}`);
  } catch (err: unknown) {
    const msg = (err as Error).message || '';
    if (msg.includes('INVALID_CREDENTIALS')) {
      error(res, 'Invalid email or password', 401);
    } else if (msg.includes('TOKEN_EXTRACTION_FAILED')) {
      error(res, msg, 502);
    } else {
      error(res, `Login failed: ${msg}`, 502);
    }
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.sessionId) {
    deleteSession(req.sessionId);
    logoutFromFinanvo();
  }
  res.clearCookie('mca_session', { httpOnly: true, sameSite: 'strict' });
  success(res, {}, 'Logged out successfully');
}

export function status(req: Request, res: Response): void {
  success(res, {
    authenticated: true,
    email: req.sessionEmail,
    sessionId: req.sessionId,
  });
}
