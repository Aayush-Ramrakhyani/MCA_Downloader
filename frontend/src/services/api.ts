import axios from 'axios';
import type {
  ApiResponse,
  Company,
  DocumentsResult,
  OrderCalculation,
  QueueItem,
  IntegrationMap,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mca_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('mca_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; email: string }>>('/auth/login', { email, password }),
  logout: () => api.post<ApiResponse>('/auth/logout'),
  status: () => api.get<ApiResponse<{ authenticated: boolean; email: string }>>('/auth/status'),
};

// ─── Companies ────────────────────────────────────────────────

export const companiesApi = {
  search: (q: string) =>
    api.get<ApiResponse<{ query: string; count: number; companies: Company[] }>>(
      `/companies/search?q=${encodeURIComponent(q)}`,
    ),
  getDocuments: (cin: string) =>
    api.get<ApiResponse<DocumentsResult>>(`/companies/${encodeURIComponent(cin)}/documents`),
};

// ─── Orders ───────────────────────────────────────────────────

export const ordersApi = {
  calculate: (cin: string, documentIds: string[], companyName?: string, availableCredits = 0) =>
    api.post<ApiResponse<OrderCalculation>>('/orders/calculate', {
      cin,
      documentIds,
      companyName,
      availableCredits,
    }),
  place: (cin: string, documentIds: string[]) =>
    api.post<ApiResponse>('/orders', { cin, documentIds }),
  list: () => api.get<ApiResponse<{ orders: unknown[] }>>('/orders'),
  getStatus: (orderId: string) => api.get<ApiResponse>(`/orders/${orderId}/status`),
};

// ─── Downloads ────────────────────────────────────────────────

export const downloadsApi = {
  enqueue: (documentIds: string[], orderId?: string, cin?: string) =>
    api.post<ApiResponse<{ queued: QueueItem[] }>>('/downloads', { documentIds, orderId, cin }),
  getAll: () => api.get<ApiResponse<{ active: QueueItem[]; history: unknown[] }>>('/downloads'),
  getQueueStatus: (queueId: string) =>
    api.get<ApiResponse<QueueItem>>(`/downloads/queue/${queueId}`),
  streamUrl: (documentId: string, orderId?: string, cin?: string) => {
    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (cin) params.set('cin', cin);
    return `/api/downloads/stream/${documentId}?${params.toString()}`;
  },
  zipDownload: (refKeys: string[], transactionId: string, companyName?: string) =>
    api.post('/downloads/zip', { refKeys, transactionId, companyName }, { responseType: 'blob', timeout: 300000 }),
};

// ─── Account ──────────────────────────────────────────────────

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

export const accountApi = {
  getProfile:      () => api.get<ApiResponse<UserProfile>>('/account/profile'),
  getCredits:      () => api.get<ApiResponse<CreditBalance>>('/account/credits'),
  getTransactions: () => api.get<ApiResponse<{ transactions: FinanvoTransaction[] }>>('/account/transactions'),
};

// ─── Integration status ───────────────────────────────────────

export const integrationApi = {
  getStatus: () => api.get<ApiResponse<IntegrationMap>>('/integration-status'),
};

export default api;
