import { Request, Response } from 'express';
import { getCompanyDocuments } from '../services/finanvo/document.service';
import { success, error } from '../utils/response';
import { finanvoClient } from '../services/finanvo/finanvo.client';
import { isValidCin } from '../utils/cin';

export async function getDocuments(req: Request, res: Response): Promise<void> {
  const { cin } = req.params as { cin: string };

  if (!isValidCin(cin)) {
    error(res, `Invalid CIN format: "${cin}"`, 400);
    return;
  }

  if (req.finanvoToken) {
    finanvoClient.setAuthToken(req.finanvoToken);
  }

  try {
    const result = await getCompanyDocuments(cin);
    success(res, result);
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Failed to fetch documents';
    error(res, msg, 502);
  }
}
