import { Request, Response } from 'express';
import { searchCompanies } from '../services/finanvo/company.service';
import { success, error } from '../utils/response';
import { finanvoClient } from '../services/finanvo/finanvo.client';

export async function search(req: Request, res: Response): Promise<void> {
  const q = req.query['q'] as string | undefined;

  if (!q || q.trim().length < 2) {
    error(res, 'Query parameter "q" must be at least 2 characters', 400);
    return;
  }

  // Attach session's Finanvo token for this request
  if (req.finanvoToken) {
    finanvoClient.setAuthToken(req.finanvoToken);
  }

  try {
    const companies = await searchCompanies(q.trim());
    success(res, { query: q.trim(), count: companies.length, companies });
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Search failed';
    error(res, msg, 502);
  }
}
