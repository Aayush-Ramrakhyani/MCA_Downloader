// ─── Shared types mirroring backend normalized shapes ───────────

export interface Company {
  cin: string;
  name: string;
  status: string | null;
  category: string | null;
  subCategory: string | null;
  classOfCompany: string | null;
  dateOfIncorporation: string | null;
  registeredState: string | null;
  registeredOfficeAddress: string | null;
}

export interface Document {
  id: string;
  formId: string | null;
  name: string;
  description: string | null;
  category: string | null;
  year: number | null;
  filingDate: string | null;
  fileName: string | null;
  srn: string | null;
}

export interface DocumentsResult {
  cin: string;
  companyName: string | null;
  totalCount: number;
  documents: Document[];
}

export interface OrderCalculation {
  cin: string;
  companyName: string | null;
  selectedDocCount: number;
  rateDescription: string;
  subTotal: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  creditsApplied: number;
  amountDue: number;
}

export interface QueueItem {
  id: string;
  documentId: string;
  orderId?: string;
  cin?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  fileName?: string;
  filePath?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  retries: number;
}

export type IntegrationStatus =
  | 'IMPLEMENTED'
  | 'PARTIALLY_IMPLEMENTED'
  | 'MISSING_API'
  | 'REQUIRES_AUTHORIZATION'
  | 'REQUIRES_PAYMENT';

export interface IntegrationMap {
  login: IntegrationStatus;
  companySearch: IntegrationStatus;
  cinDocuments: IntegrationStatus;
  orderCreation: IntegrationStatus;
  submitCinDocs: IntegrationStatus;
  documentDownload: IntegrationStatus;
}

// ─── API Response wrapper ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}
