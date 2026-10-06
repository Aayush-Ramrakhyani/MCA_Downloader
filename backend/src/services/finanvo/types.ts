// ─────────────────────────────────────────────────────────────
// Finanvo API Types
//
// HOW TO UPDATE THIS FILE WHEN A NEW API IS CAPTURED:
//   1. Open Chrome DevTools → Network → Fetch/XHR
//   2. Perform the action on mcadownload.com
//   3. Find the corresponding request
//   4. Record: URL, Method, Request Headers, Payload, Response
//   5. Add/update the interface below with actual field names
//   6. Update the corresponding service file
// ─────────────────────────────────────────────────────────────

// ─── Auth ────────────────────────────────────────────────────

export interface FinanvoLoginRequest {
  email: string;
  password: string;
}

/**
 * STATUS: PARTIALLY_KNOWN
 *
 * The exact response structure is not yet confirmed.
 * After capturing the login response in DevTools, replace this
 * with the real structure and update FINANVO_TOKEN_PATH in .env.
 *
 * Set FINANVO_TOKEN_PATH to the dot-notation path of the token
 * inside this response, e.g. "token" or "data.token".
 */
export interface FinanvoLoginResponse {
  [key: string]: unknown;
}

// ─── Company Search ───────────────────────────────────────────

/**
 * STATUS: PARTIALLY_KNOWN
 *
 * Observed from GET /search/company?query=Enercomp
 * Exact field names need confirmation from a captured response.
 * If the real API uses different field names, update below and
 * update normalizeCompany() in company.service.ts.
 */
export interface FinanvoCompanyRaw {
  [key: string]: unknown;
}

export interface FinanvoCompanySearchResponse {
  [key: string]: unknown;
}

// ─── CIN Documents ────────────────────────────────────────────

/**
 * STATUS: PARTIALLY_KNOWN
 *
 * Observed from GET /company/cin-docs?cin=<CIN>
 * Field names (document name, form ID, category, year etc.) need
 * confirmation from a captured response.
 * Update FinanvoDocumentRaw with the actual field names once confirmed.
 */
export interface FinanvoDocumentRaw {
  [key: string]: unknown;
}

export interface FinanvoCinDocsResponse {
  [key: string]: unknown;
}

// ─── Order / Payment ──────────────────────────────────────────

/**
 * STATUS: MISSING_API
 *
 * Endpoint observed: POST /subscription/saveCinDinPayment
 * The complete request payload is NOT yet known.
 *
 * TO IMPLEMENT:
 *   1. On mcadownload.com, select documents and proceed to payment.
 *   2. In DevTools → Network → find the saveCinDinPayment request.
 *   3. Record the full Request Payload and Response.
 *   4. Fill in FinanvoCreateOrderRequest and FinanvoCreateOrderResponse.
 *   5. Remove this comment and the Error throw in order.service.ts.
 */
export interface FinanvoCreateOrderRequest {
  // TODO: Fill in after capturing from DevTools
  [key: string]: unknown;
}

export interface FinanvoCreateOrderResponse {
  // TODO: Fill in after capturing from DevTools
  [key: string]: unknown;
}

/**
 * STATUS: MISSING_API
 *
 * A request named "submit-cin-doc..." was observed in the live app
 * but the full URL, method, and payload are not yet known.
 *
 * TO IMPLEMENT:
 *   1. On mcadownload.com, trigger the document submission step.
 *   2. In DevTools → find the submit-cin-doc request.
 *   3. Record: full URL, Method, Headers, Payload, Response.
 *   4. Fill in FinanvoSubmitDocRequest and FinanvoSubmitDocResponse.
 *   5. Implement submitCinDocs() in order.service.ts.
 */
export interface FinanvoSubmitDocRequest {
  // TODO: Fill in after capturing from DevTools
  [key: string]: unknown;
}

export interface FinanvoSubmitDocResponse {
  // TODO: Fill in after capturing from DevTools
  [key: string]: unknown;
}

// ─── Download ─────────────────────────────────────────────────

/**
 * STATUS: MISSING_API
 *
 * The document download endpoint is not yet known.
 *
 * TO IMPLEMENT:
 *   1. On mcadownload.com, after an order is complete, trigger a download.
 *   2. In DevTools → find the download request.
 *   3. Record: full URL, Method, Headers (especially auth), Response type
 *      (JSON with URL? Binary stream? Redirect?).
 *   4. Fill in FinanvoDownloadRequest and FinanvoDownloadResponse.
 *   5. Implement downloadDocument() in download.service.ts.
 */
export interface FinanvoDownloadRequest {
  // TODO: Fill in after capturing from DevTools
  [key: string]: unknown;
}

export interface FinanvoDownloadResponse {
  // TODO: Fill in after capturing from DevTools — may be a binary stream
  [key: string]: unknown;
}

// ─── Integration Status ───────────────────────────────────────

export type IntegrationStatus =
  | 'IMPLEMENTED'
  | 'PARTIALLY_IMPLEMENTED'
  | 'MISSING_API'
  | 'REQUIRES_AUTHORIZATION'
  | 'REQUIRES_PAYMENT';

export const INTEGRATION_STATUS: Record<string, IntegrationStatus> = {
  login:              'IMPLEMENTED',
  companySearch:      'IMPLEMENTED',
  cinDocuments:       'IMPLEMENTED',
  orderCreation:      'MISSING_API',
  submitCinDocs:      'MISSING_API',
  documentDownload:   'MISSING_API',
};
