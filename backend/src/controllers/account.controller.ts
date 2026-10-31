/*
 * account.controller.ts
 * Exposes endpoints for fetching the logged-in user's Finanvo profile, credit
 * balance, and transaction history by delegating to the account service.
 */
import { Request, Response } from 'express';
import { getUserProfile, getCreditBalance, getTransactions } from '../services/finanvo/account.service';
import { finanvoClient } from '../services/finanvo/finanvo.client';
import { success, error } from '../utils/response';

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (req.finanvoToken) finanvoClient.setAuthToken(req.finanvoToken);
  try {
    const profile = await getUserProfile();
    success(res, profile);
  } catch (err_: unknown) {
    error(res, (err_ as Error).message ?? 'Failed to fetch profile', 502);
  }
}

export async function getCredits(req: Request, res: Response): Promise<void> {
  if (req.finanvoToken) finanvoClient.setAuthToken(req.finanvoToken);
  try {
    const credits = await getCreditBalance();
    success(res, credits);
  } catch (err_: unknown) {
    error(res, (err_ as Error).message ?? 'Failed to fetch credit balance', 502);
  }
}

export async function listTransactions(req: Request, res: Response): Promise<void> {
  if (req.finanvoToken) finanvoClient.setAuthToken(req.finanvoToken);
  try {
    const transactions = await getTransactions();
    success(res, { transactions });
  } catch (err_: unknown) {
    error(res, (err_ as Error).message ?? 'Failed to fetch transactions', 502);
  }
}
