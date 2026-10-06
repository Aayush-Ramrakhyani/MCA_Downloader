import { Router } from 'express';
import {
  enqueueDownloads,
  getDownloadStatus,
  listDownloads,
  streamDocument,
  downloadZip,
} from '../controllers/download.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, enqueueDownloads);
router.post('/zip', requireAuth, downloadZip);
router.get('/', requireAuth, listDownloads);
router.get('/queue/:queueId', requireAuth, getDownloadStatus);
router.get('/stream/:documentId', requireAuth, streamDocument);

export default router;
