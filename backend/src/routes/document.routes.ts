/*
 * document.routes.ts
 * Mounts GET /:cin/documents, which fetches the list of available MCA documents
 * for a given Corporate Identity Number from the Finanvo API.
 */
import { Router } from 'express';
import { getDocuments } from '../controllers/document.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/:cin/documents', requireAuth, getDocuments);

export default router;
