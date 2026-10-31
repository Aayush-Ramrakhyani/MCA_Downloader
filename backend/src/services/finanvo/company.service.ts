/*
 * company.service.ts
 * Queries the Finanvo company-search endpoint and normalises the loosely-typed raw
 * response into a consistent NormalizedCompany shape, trying multiple known field
 * name variants to handle API response changes.
 */
import { finanvoClient } from './finanvo.client';
import { FinanvoCompanyRaw, FinanvoCompanySearchResponse } from './types';
import { logger } from '../../config/logger';

export interface NormalizedCompany {
  cin: string;
  name: string;
  status: string | null;
  category: string | null;
  subCategory: string | null;
  classOfCompany: string | null;
  dateOfIncorporation: string | null;
  registeredState: string | null;
  registeredOfficeAddress: string | null;
  raw: FinanvoCompanyRaw;
}

export async function searchCompanies(query: string): Promise<NormalizedCompany[]> {
  if (!query || query.trim().length < 2) {
    throw new Error('VALIDATION: Query must be at least 2 characters.');
  }

  const res = await finanvoClient.get<FinanvoCompanySearchResponse>(
    `/search/company?query=${encodeURIComponent(query.trim())}`,
  );

  const rawData = res.data;
  const companies = extractCompanyArray(rawData);

  logger.debug(`Company search for "${query}" returned ${companies.length} results`);
  return companies.map(normalizeCompany);
}

function extractCompanyArray(response: FinanvoCompanySearchResponse): FinanvoCompanyRaw[] {
  if (Array.isArray(response)) return response as FinanvoCompanyRaw[];

  const possibleArrayPaths = ['data', 'companies', 'results', 'items', 'list']; // common wrapper keys seen in Finanvo responses
  for (const path of possibleArrayPaths) {
    const candidate = (response as Record<string, unknown>)[path];
    if (Array.isArray(candidate)) return candidate as FinanvoCompanyRaw[];
  }

  logger.warn('Could not find company array in search response', {
    responseKeys: Object.keys(response as object),
  });
  return [];
}

function normalizeCompany(raw: FinanvoCompanyRaw): NormalizedCompany {
  const r = raw as Record<string, unknown>;

  return {
    // mcadownload.com uses "dataid" for CIN and "name" for company name
    cin:  tryString(r, ['dataid', 'cin', 'CIN', 'cinNumber', 'company_cin']) ?? '',
    name: tryString(r, ['name', 'companyName', 'company_name', 'COMPANY_NAME', 'LEGAL_NAME']) ?? 'Unknown',
    status:                  tryString(r, ['status', 'companyStatus', 'company_status']) ?? null,
    category:                tryString(r, ['category', 'companyCategory', 'company_category']) ?? null,
    subCategory:             tryString(r, ['subCategory', 'sub_category', 'companySubCategory']) ?? null,
    classOfCompany:          tryString(r, ['classOfCompany', 'class_of_company', 'companyClass']) ?? null,
    dateOfIncorporation:     tryString(r, ['dateOfIncorporation', 'date_of_incorporation', 'incorporationDate']) ?? null,
    registeredState:         tryString(r, ['registeredState', 'state', 'stateCode']) ?? null,
    registeredOfficeAddress: tryString(r, ['registeredOfficeAddress', 'address', 'registered_address']) ?? null,
    raw,
  };
}

function tryString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return null;
}
