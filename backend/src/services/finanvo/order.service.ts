import { finanvoClient } from './finanvo.client';
import { logger } from '../../config/logger';

export interface CinDocEntry {
  cin: string;
  companyName: string;
  docIds: string[];   // ref_key values selected by user
}

export interface PlacedOrder {
  txnIds: string[];
  submitted: boolean;
  cinDocsPayload: SubmitCinDocsItem[];
  amount: number;
  gst: number;
  totalAmount: number;
}

interface SubmitCinDocsItem {
  transaction_id: string;
  cin: string;
  docs: { ref_key: string }[];
}

/**
 * Full order flow for CIN documents:
 *  1. POST /subscription/saveCinDinPayment  — creates order, deducts credits
 *  2. POST /subscription/submit-cin-docs    — queues docs for download
 *
 * Confirmed from mcadownload.com JS bundle (getOrderDataArr) and DevTools screenshots.
 */
export async function createOrder(entries: CinDocEntry[]): Promise<PlacedOrder> {
  if (!entries.length) throw new Error('VALIDATION: No companies/documents provided.');

  const totalDocs = entries.reduce((sum, e) => sum + e.docIds.length, 0);
  if (totalDocs === 0) throw new Error('VALIDATION: No documents selected.');

  // ₹145 per company (CIN), not per document
  const amount = entries.length * 145;
  const gst = Math.floor(amount * 0.18);
  const totalAmount = amount + gst;

  const today = new Date();
  const orderDate = formatDate(today);

  // Matches mcadownload.com's getOrderDataArr() format exactly
  const dataArrObj = entries.map(e => ({
    CIN: e.cin,
    NAME: e.companyName,
    DOCS: e.docIds.map(ref_key => ({ ref_key })),
  }));

  const payload = {
    dataArr: JSON.stringify(dataArrObj),
    orderDate,
    fromDate: orderDate,
    toDate: orderDate,
    amount,
    period: '1M',
    gst,
    totalAmount,
    identiferType: 'CIN',
    identiferDesc: 'DOWN_DOCS',
    redirectUrl: 'https://mcadownload.com/company',
  };

  logger.info('Creating CIN doc order', { totalDocs, companies: entries.length, amount, totalAmount });

  let txnIds: string[];

  const orderRes = await finanvoClient.post<{ message?: string; txn_ids?: string[] }>(
    '/subscription/saveCinDinPayment',
    payload,
  );

  const data = orderRes.data;
  if (!data.txn_ids || !Array.isArray(data.txn_ids) || data.txn_ids.length === 0) {
    throw new Error(
      data.message
        ? `ORDER_FAILED: ${data.message}`
        : 'ORDER_FAILED: Finanvo returned no transaction IDs. ' +
          'Your account may have insufficient credits — top up at mcadownload.com first.',
    );
  }
  txnIds = data.txn_ids;

  // Build submitCinDocs payload — mirrors mcadownload.com post-payment flow
  const cinDocsPayload: SubmitCinDocsItem[] = txnIds
    .map((txnId, i) => {
      const entry = entries[i];
      if (!entry || entry.docIds.length === 0) return null;
      return {
        transaction_id: txnId,
        cin: entry.cin,
        docs: entry.docIds.map(ref_key => ({ ref_key })),
      };
    })
    .filter((x): x is SubmitCinDocsItem => x !== null);

  let submitted = false;
  if (cinDocsPayload.length > 0) {
    try {
      await finanvoClient.post('/subscription/submit-cin-docs', { cinDocsPayload });
      submitted = true;
      logger.info('submitCinDocs succeeded', { txnIds });
    } catch (err: unknown) {
      logger.warn('submitCinDocs failed — docs may still be queued server-side', {
        error: (err as Error).message,
        txnIds,
      });
    }
  }

  return { txnIds, submitted, cinDocsPayload, amount, gst, totalAmount };
}

export async function getOrderStatus(orderId: string): Promise<unknown> {
  const res = await finanvoClient.get(`/subscription/mcd/order-status/${orderId}`);
  return res.data;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
