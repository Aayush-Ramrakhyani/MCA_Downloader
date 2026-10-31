/*
 * download.controller.ts
 * Handles document download operations: queuing individual downloads, streaming
 * a single document, and bundling multiple documents into a ZIP archive on the fly.
 */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiverLib = require('archiver') as (fmt: string, opts?: object) => import('archiver').Archiver; // no ESM export for archiver
import { downloadQueue, downloadDocumentStream } from '../services/finanvo/download.service';
import { getAllDownloads } from '../services/db.service';
import { success, error } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import { finanvoClient } from '../services/finanvo/finanvo.client';
import { logger } from '../config/logger';

export function enqueueDownloads(req: Request, res: Response): void {
  const { documentIds, orderId, cin } = req.body as {
    documentIds?: string[];
    orderId?: string;
    cin?: string;
  };

  if (!documentIds?.length) {
    error(res, 'documentIds array is required', 400);
    return;
  }

  const items = documentIds.map(documentId => ({
    id: uuidv4(),
    documentId,
    orderId,
    cin,
  }));

  const queued = downloadQueue.enqueue(items);
  success(res, { queued: queued.map(q => ({ id: q.id, documentId: q.documentId, status: q.status })) }, 'Downloads queued', 202);
}

export function getDownloadStatus(req: Request, res: Response): void {
  const { queueId } = req.params as { queueId: string };
  const item = downloadQueue.getStatus(queueId);
  if (!item) { error(res, 'Download not found', 404); return; }
  success(res, item);
}

export function listDownloads(_req: Request, res: Response): void {
  success(res, { active: downloadQueue.getAll(), history: getAllDownloads() });
}

export async function downloadZip(req: Request, res: Response): Promise<void> {
  const { refKeys, transactionId, companyName } = req.body as {
    refKeys?: string[];
    transactionId?: string;
    companyName?: string;
  };

  if (!refKeys?.length) { error(res, 'refKeys array is required', 400); return; }
  if (!transactionId)   { error(res, 'transactionId is required', 400); return; }

  if (req.finanvoToken) finanvoClient.setAuthToken(req.finanvoToken);

  const safeName = (companyName ?? 'documents').replace(/[/\\?%*:|"<>]/g, '_');
  const zipName  = `${safeName}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = archiverLib('zip', { zlib: { level: 6 } }); // level 6 balances speed vs. compression ratio
  archive.pipe(res);

  // Download all files in parallel to temp files, then add to archive at once
  const downloadToTemp = async (refKey: string) => {
    const { stream, fileName } = await downloadDocumentStream({ documentId: refKey, orderId: transactionId });
    const tmpPath = path.join(os.tmpdir(), `mca_${refKey}_${Date.now()}.pdf`);
    await new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(tmpPath);
      (stream as NodeJS.ReadableStream).pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    return { tmpPath, fileName: fileName || `${refKey}.pdf` };
  };

  const results = await Promise.allSettled(refKeys.map(k => downloadToTemp(k)));

  const tmpFiles: string[] = [];
  let added = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      archive.file(r.value.tmpPath, { name: r.value.fileName });
      tmpFiles.push(r.value.tmpPath);
      added++;
    } else {
      logger.warn(`Skipping doc in zip — ${(r.reason as Error).message}`);
    }
  }

  if (added === 0) {
    archive.abort();
    if (!res.headersSent) error(res, 'No documents could be downloaded. Check your transaction credits.', 502);
    return;
  }

  await archive.finalize();
  tmpFiles.forEach(f => fs.unlink(f, () => {})); // clean up temp files after archive streams out
}

export async function streamDocument(req: Request, res: Response): Promise<void> {
  const { documentId } = req.params as { documentId: string };
  const orderId = req.query['orderId'] as string | undefined;
  const cin = req.query['cin'] as string | undefined;

  if (req.finanvoToken) finanvoClient.setAuthToken(req.finanvoToken);

  try {
    const { stream, fileName, mimeType } = await downloadDocumentStream({ documentId, orderId, cin });
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    stream.pipe(res);
  } catch (err: unknown) {
    error(res, (err as Error).message ?? 'Download failed', 501);
  }
}
