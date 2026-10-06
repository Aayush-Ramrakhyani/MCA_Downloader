import { Router } from 'express';
import { getProfile, getCredits, listTransactions } from '../controllers/account.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile',      requireAuth, getProfile);
router.get('/credits',      requireAuth, getCredits);
router.get('/transactions', requireAuth, listTransactions);

export default router;
