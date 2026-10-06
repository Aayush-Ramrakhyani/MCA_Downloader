import { Router } from 'express';
import { search } from '../controllers/company.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/search', requireAuth, search);

export default router;
