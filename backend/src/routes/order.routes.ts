/*
 * order.routes.ts
 * Mounts order endpoints: price calculation preview, order placement, order listing,
 * and per-order status polling.
 */
import { Router } from 'express';
import {
  calculateOrderPreview,
  placeOrder,
  orderStatus,
  listOrders,
} from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/calculate', requireAuth, calculateOrderPreview);
router.post('/', requireAuth, placeOrder);
router.get('/', requireAuth, listOrders);
router.get('/:orderId/status', requireAuth, orderStatus);

export default router;
