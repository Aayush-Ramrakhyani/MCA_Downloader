/*
 * auth.routes.ts
 * Mounts authentication endpoints: POST /login (public), POST /logout and
 * GET /status (both require a valid session).
 */
import { Router } from 'express';
import { login, logout, status } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/status', requireAuth, status);

export default router;
