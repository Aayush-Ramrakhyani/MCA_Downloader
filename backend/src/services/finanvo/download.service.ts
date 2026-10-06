import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import { finanvoClient } from './finanvo.client';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export interface DownloadDocumentInput {
  documentId: string;   // ref_key
  orderId?: string;     // transaction_id from order creation
  cin?: string;
  fileName?: string;
}

export interface DownloadResult {
  documentId: string;
  fileName: string;
  mimeType: string;
  filePath: string;
  sizeBytes: number;
}

/**
 * Download a document as a stream from Finanvo.
 * Endpoint: GET /subscription/mcd/download-doc?transaction_id=...&ref_key=...
 * Confirmed from mcadownload.com JS bundle.
 */
export async function downloadDocumentStream(
  input: DownloadDocumentInput,
): Promise<{ stream: Readable; fileName: string; mimeType: string }> {
  if (!input.orderId) {
    throw new Error('DOWNLOAD_REQUIRES_ORDER: transaction_id (orderId) is required to download a document.');
  }

  const params = new URLSearchParams({
    transaction_id: input.orderId,
    ref_key: input.documentId,
  });

  const res = await finanvoClient.getStream(
    `/subscription/mcd/download-doc?${params.toString()}`,
  );

  const contentDisposition = res.headers['content-disposition'] as string | undefined;
  const mimeType = (res.headers['content-type'] as string | undefined) ?? 'application/octet-stream';

  let fileName = input.fileName ?? `${input.documentId}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/i);
    if (match?.[1]) fileName = match[1].trim();
  }

  return { stream: res.data as Readable, fileName, mimeType };
}

/**
 * Download a document and save to the local downloads directory.
 */
export async function downloadDocument(input: DownloadDocumentInput): Promise<DownloadResult> {
  const { stream, fileName, mimeType } = await downloadDocumentStream(input);

  const downloadsPath = path.isAbsolute(env.downloadsDir)
    ? env.downloadsDir
    : path.resolve(process.cwd(), env.downloadsDir);

  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  const safeFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
  const filePath = path.join(downloadsPath, safeFileName);

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    (stream as Readable).pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const sizeBytes = fs.statSync(filePath).size;
  logger.info(`Downloaded: ${safeFileName} (${sizeBytes} bytes)`);

  return {
    documentId: input.documentId,
    fileName: safeFileName,
    mimeType,
    filePath,
    sizeBytes,
  };
}

// ─── Download Queue ────────────────────────────────────────────────────────

export interface QueueItem {
  id: string;
  documentId: string;
  orderId?: string;
  cin?: string;
  fileName?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  filePath?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  retries: number;
}

const MAX_RETRIES = 3;

class DownloadQueue {
  private queue: QueueItem[] = [];
  private activeCount = 0;
  private readonly concurrency: number;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  enqueue(items: Omit<QueueItem, 'status' | 'createdAt' | 'retries'>[]): QueueItem[] {
    const created: QueueItem[] = items.map(item => ({
      ...item,
      status: 'pending' as const,
      createdAt: Date.now(),
      retries: 0,
    }));
    this.queue.push(...created);
    this.processNext();
    return created;
  }

  getStatus(id: string): QueueItem | undefined {
    return this.queue.find(item => item.id === id);
  }

  getAll(): QueueItem[] {
    return [...this.queue];
  }

  private processNext(): void {
    while (this.activeCount < this.concurrency) {
      const pending = this.queue.find(item => item.status === 'pending');
      if (!pending) break;
      this.activeCount++;
      pending.status = 'downloading';
      this.download(pending).finally(() => {
        this.activeCount--;
        this.processNext();
      });
    }
  }

  private async download(item: QueueItem): Promise<void> {
    try {
      const result = await downloadDocument({
        documentId: item.documentId,
        orderId: item.orderId,
        cin: item.cin,
        fileName: item.fileName,
      });
      item.status = 'completed';
      item.fileName = result.fileName;
      item.filePath = result.filePath;
      item.completedAt = Date.now();
    } catch (err: unknown) {
      item.retries++;
      if (item.retries < MAX_RETRIES) {
        logger.warn(`Download failed for ${item.documentId}, retrying (${item.retries}/${MAX_RETRIES})`);
        item.status = 'pending';
      } else {
        item.status = 'failed';
        item.error = (err as Error).message;
        logger.error(`Download permanently failed for ${item.documentId}`, { error: (err as Error).message });
      }
    }
  }
}

export const downloadQueue = new DownloadQueue(env.downloadConcurrency);
