/*
 * db.service.ts
 * Lightweight flat-file JSON database for persisting sessions, orders, and download
 * records between requests. Reads and writes a single JSON file on every operation —
 * suitable for a single-user desktop app but not for concurrent server deployments.
 */
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface Session {
  id: string;
  finanvoToken: string;
  userEmail: string;
  createdAt: number;
  expiresAt: number;
}

export interface SearchRecord {
  id: string;
  query: string;
  resultCount: number;
  timestamp: number;
}

export interface OrderRecord {
  id: string;
  sessionId: string;
  cin: string;
  companyName: string | null;
  documentIds: string[];
  status: string;
  totalAmount: number;
  createdAt: number;
  updatedAt: number;
  raw?: unknown;
  txnIds?: string[];
}

export interface DownloadRecord {
  id: string;
  sessionId: string;
  orderId: string;
  documentId: string;
  fileName: string;
  filePath: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface DbData {
  sessions: Session[];
  searches: SearchRecord[];
  orders: OrderRecord[];
  downloads: DownloadRecord[];
}

const DEFAULT: DbData = {
  sessions: [],
  searches: [],
  orders: [],
  downloads: [],
};

function dbFilePath(): string {
  return path.isAbsolute(env.dbPath)
    ? env.dbPath
    : path.resolve(process.cwd(), env.dbPath);
}

function read(): DbData {
  const filePath = dbFilePath();
  if (!fs.existsSync(filePath)) return { ...DEFAULT };
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { ...DEFAULT, ...JSON.parse(raw) } as DbData;
  } catch {
    logger.warn('DB file corrupted, starting fresh');
    return { ...DEFAULT };
  }
}

function write(data: DbData): void {
  const filePath = dbFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Sessions ─────────────────────────────────────────────────

export function saveSession(session: Session): void {
  const db = read();
  db.sessions = db.sessions.filter(s => s.id !== session.id);
  db.sessions.push(session);
  const now = Date.now();
  db.sessions = db.sessions.filter(s => s.expiresAt > now); // evict expired sessions on every write
  write(db);
}

export function getSession(id: string): Session | null {
  const db = read();
  return db.sessions.find(s => s.id === id && s.expiresAt > Date.now()) ?? null;
}

export function deleteSession(id: string): void {
  const db = read();
  db.sessions = db.sessions.filter(s => s.id !== id);
  write(db);
}

// ─── Orders ───────────────────────────────────────────────────

export function saveOrder(order: OrderRecord): void {
  const db = read();
  const idx = db.orders.findIndex(o => o.id === order.id);
  if (idx >= 0) db.orders[idx] = order;
  else db.orders.push(order);
  write(db);
}

export function getAllOrders(): OrderRecord[] {
  return read().orders;
}

export function getOrder(id: string): OrderRecord | null {
  return read().orders.find(o => o.id === id) ?? null;
}

// ─── Downloads ────────────────────────────────────────────────

export function saveDownload(record: DownloadRecord): void {
  const db = read();
  const idx = db.downloads.findIndex(d => d.id === record.id);
  if (idx >= 0) db.downloads[idx] = record;
  else db.downloads.push(record);
  write(db);
}

export function getAllDownloads(): DownloadRecord[] {
  return read().downloads;
}
