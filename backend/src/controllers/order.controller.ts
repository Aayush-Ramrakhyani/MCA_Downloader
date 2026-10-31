/*
 * order.controller.ts
 * Handles order preview (local price calculation), order placement (calls Finanvo),
 * order status polling, and listing all locally stored orders.
 */
import { Request, Response } from 'express';
import { createOrder, getOrderStatus } from '../services/finanvo/order.service';
import { calculateOrder } from '../services/pricing.service';
import { saveOrder, getAllOrders } from '../services/db.service';
import { success, error } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import { finanvoClient } from '../services/finanvo/finanvo.client';

export function calculateOrderPreview(req: Request, res: Response): void {
  const { cin, companyName, documentIds, availableCredits } = req.body as {
    cin?: string;
    companyName?: string;
    documentIds?: string[];
    availableCredits?: number;
  };

  if (!cin || !documentIds?.length) {
    error(res, 'cin and documentIds are required', 400);
    return;
  }

  const calculation = calculateOrder({
    cin,
    companyName: companyName ?? null,
    selectedDocCount: documentIds.length,
    availableCredits: availableCredits ?? 0,
  });

  success(res, calculation);
}

export async function placeOrder(req: Request, res: Response): Promise<void> {
  const { cin, companyName, documentIds } = req.body as {
    cin?: string;
    companyName?: string;
    documentIds?: string[];
  };

  if (!cin || !documentIds?.length) {
    error(res, 'cin and documentIds are required', 400);
    return;
  }

  if (req.finanvoToken) finanvoClient.setAuthToken(req.finanvoToken);

  try {
    const result = await createOrder([
      { cin, companyName: companyName ?? cin, docIds: documentIds },
    ]);

    const record = {
      id: uuidv4(),
      sessionId: req.sessionId!,
      cin,
      companyName: companyName ?? null,
      documentIds,
      status: result.submitted ? 'submitted' : 'pending_payment', // 'submitted' means Finanvo queued the docs
      totalAmount: result.totalAmount,
      txnIds: result.txnIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveOrder(record); // persists locally for the Orders page history
    success(res, { ...result, localOrderId: record.id }, 'Order created', 201);
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Order creation failed';
    if (msg.startsWith('ORDER_FAILED') || msg.startsWith('VALIDATION')) {
      error(res, msg, 400);
    } else {
      error(res, msg, 502);
    }
  }
}

export async function orderStatus(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as { orderId: string };
  try {
    const result = await getOrderStatus(orderId);
    success(res, result);
  } catch (err: unknown) {
    error(res, (err as Error).message ?? 'Failed to fetch order status', 502);
  }
}

export function listOrders(_req: Request, res: Response): void {
  success(res, { orders: getAllOrders() });
}
