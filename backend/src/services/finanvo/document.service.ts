/*
 * document.service.ts
 * Fetches the list of MCA documents for a given CIN from Finanvo and normalises
 * the raw response into typed NormalizedDocument objects, handling multiple known
 * field-name variants for both the document array and the company name.
 */
import { finanvoClient } from './finanvo.client';
import { FinanvoDocumentRaw, FinanvoCinDocsResponse } from './types';
import { isValidCin, normalizeCin } from '../../utils/cin';
import { logger } from '../../config/logger';

export interface NormalizedDocument {
  id: string;        // ref_key — used for ordering and downloading
  formId: string | null;
  name: string;
  description: string | null;
  category: string | null;
  year: number | null;
  filingDate: string | null;
  fileName: string | null;
  srn: string | null;
  raw: FinanvoDocumentRaw;
}

export interface DocumentsResult {
  cin: string;
  companyName: string | null;
  totalCount: number;
  documents: NormalizedDocument[];
}

export async function getCompanyDocuments(cin: string): Promise<DocumentsResult> {
  const normalized = normalizeCin(cin);

  if (!isValidCin(normalized)) {
    throw new Error(`VALIDATION: Invalid CIN format: "${cin}"`);
  }

  const res = await finanvoClient.get<FinanvoCinDocsResponse>(
    `/company/cin-docs?cin=${encodeURIComponent(normalized)}`,
  );

  const rawData = res.data;
  const docs = extractDocumentArray(rawData);
  const companyName = extractCompanyName(rawData);

  logger.debug(`CIN ${normalized}: ${docs.length} documents retrieved`);

  return {
    cin: normalized,
    companyName,
    totalCount: docs.length,
    documents: docs.map(normalizeDocument),
  };
}

// mcadownload.com normalizeDocsResponse: checks t.docs then t.data
function extractDocumentArray(response: FinanvoCinDocsResponse): FinanvoDocumentRaw[] {
  if (Array.isArray(response)) return response as FinanvoDocumentRaw[];

  const r = response as Record<string, unknown>;
  if (Array.isArray(r['docs'])) return r['docs'] as FinanvoDocumentRaw[];
  if (Array.isArray(r['data'])) return r['data'] as FinanvoDocumentRaw[];

  for (const path of ['documents', 'cinDocs', 'results', 'items']) {
    if (Array.isArray(r[path])) return r[path] as FinanvoDocumentRaw[];
  }

  logger.warn('Could not find document array in CIN docs response', {
    responseKeys: Object.keys(r),
  });
  return [];
}

function extractCompanyName(response: FinanvoCinDocsResponse): string | null {
  const r = response as Record<string, unknown>;
  for (const key of ['companyName', 'company_name', 'name', 'company', 'NAME']) {
    if (typeof r[key] === 'string') return r[key] as string;
  }
  const data = r['data'] as Record<string, unknown> | undefined;
  if (data && typeof data === 'object') {
    for (const key of ['companyName', 'company_name', 'name']) {
      if (typeof data[key] === 'string') return data[key] as string;
    }
  }
  return null;
}

function normalizeDocument(raw: FinanvoDocumentRaw): NormalizedDocument {
  const r = raw as Record<string, unknown>;

  return {
    // ref_key is the primary identifier used by mcadownload.com for ordering/downloading
    id:          tryString(r, ['ref_key', 'id', '_id', 'docId', 'documentId']) ?? '',
    formId:      tryString(r, ['formId', 'form_id', 'formType', 'form_type']) ?? null,
    name:        tryString(r, ['fileName', 'doc_name', 'documentName', 'document_name', 'name', 'title']) ?? 'Unknown Document',
    description: tryString(r, ['description', 'desc']) ?? null,
    category:    tryString(r, ['documentCategory', 'category', 'doc_category', 'type']) ?? null,
    year:        tryNumber(r, ['year', 'filingYear', 'filing_year']) ?? null,
    filingDate:  tryString(r, ['filingDate', 'filing_date', 'dateOfFiling', 'date']) ?? null,
    fileName:    tryString(r, ['fileName', 'doc_name', 'file_name', 'filename']) ?? null,
    srn:         tryString(r, ['srn', 'SRN', 'serviceRequestNumber']) ?? null,
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

function tryNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const n = parseInt(val, 10);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}
