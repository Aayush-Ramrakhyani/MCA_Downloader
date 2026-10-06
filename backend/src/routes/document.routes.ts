import { Router } from 'express';
import { getDocuments } from '../controllers/document.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/:cin/documents', requireAuth, getDocuments);

export default router;
