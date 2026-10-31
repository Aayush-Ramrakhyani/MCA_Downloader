/*
 * account.routes.ts
 * Mounts account endpoints: GET /profile, GET /credits, and GET /transactions,
 * all protected by requireAuth.
 */
import { Router } from 'express';
import { getProfile, getCredits, listTransactions } from '../controllers/account.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile',      requireAuth, getProfile);
router.get('/credits',      requireAuth, getCredits);
router.get('/transactions', requireAuth, listTransactions);

export default router;
