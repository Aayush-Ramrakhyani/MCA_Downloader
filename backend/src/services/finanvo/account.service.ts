/*
 * account.service.ts
 * Fetches user profile data, credit balance (DOWN_DOCS_V3 plan), and transaction
 * history from the Finanvo API and normalises them into typed interfaces.
 */
import { finanvoClient } from './finanvo.client';

export interface UserProfile {
  email: string;
  displayName: string;
  fullName: string;
  designation: string;
  companyName: string;
  mobile: string;
  website: string;
}

export interface CreditBalance {
  code: string;
  available: number;
  used: number;
  total: number;
}

export interface FinanvoTransaction {
  id: string;
  txnId: string;
  cin: string;
  companyName: string;
  docCount: number;
  amount: number;
  status: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await finanvoClient.get<{ data: Record<string, unknown> }>('/user/basic');
  const d = res.data?.data ?? (res.data as unknown as Record<string, unknown>);
  const str = (v: unknown) => (v == null ? '' : String(v));
  return {
    email:       str(d['EMAIL']),
    displayName: str(d['NAME']),
    fullName:    str(d['FULL_NAME']),
    designation: str(d['DESIGNATION']),
    companyName: str(d['COMPANY_NAME']),
    mobile:      str(d['MOBILE']),
    website:     str(d['WEBSITE']),
  };
}

export async function getCreditBalance(): Promise<CreditBalance> {
  // Response is {"data": 0} — just a number, not an object; "used" and "total" are unavailable from this endpoint
  const res = await finanvoClient.get<{ data: number }>('/subscription/creditcount?code=DOWN_DOCS_V3');
  const available = Number(res.data?.data ?? 0);
  return { code: 'DOWN_DOCS_V3', available, used: 0, total: 0 };
}

export async function getTransactions(): Promise<FinanvoTransaction[]> {
  const res = await finanvoClient.get<{ data: Record<string, unknown>[] }>(
    '/subscription/transactions/normal?type=CIN',
  );
  const items = Array.isArray(res.data?.data) ? res.data.data : [];

  return items.map((t, i) => {
    const isCompleted = Number(t['STATUS']) === 2 || t['PAYMENT_TYPE'] != null; // STATUS=2 means paid and docs queued
    const docCount = t['total_documents'] && t['total_documents'] !== '-'
      ? Number(t['total_documents'])
      : 0;
    return {
      id:          String(t['ORDER_ID'] ?? i),
      txnId:       String(t['TRANSACTION_ID'] ?? ''),
      cin:         String(t['IDENTIFIER_VALUE'] ?? ''),
      companyName: String(t['IDENTIFIER_NAME'] ?? ''),
      docCount,
      amount:      Number(t['TOTAL_AMOUNT'] ?? 0),
      status:      isCompleted ? 'completed' : 'pending',
      createdAt:   String(t['ORDER_DATE'] ?? ''),
      raw:         t,
    };
  });
}
