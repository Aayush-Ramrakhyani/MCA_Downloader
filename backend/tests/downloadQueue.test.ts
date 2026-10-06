jest.mock('../src/services/finanvo/download.service', () => {
  const actual = jest.requireActual('../src/services/finanvo/download.service');
  return {
    ...actual,
    downloadDocument: jest.fn().mockRejectedValue(
      new Error('MISSING_API_ENDPOINT: test placeholder'),
    ),
  };
});

import { downloadQueue } from '../src/services/finanvo/download.service';

describe('DownloadQueue', () => {
  it('enqueues items and returns them in the queue', () => {
    const items = downloadQueue.enqueue([
      { id: 'q-1', documentId: 'doc-abc' },
    ]);
    expect(items).toHaveLength(1);
    // Queue immediately starts processing, so status is 'pending' or 'downloading'
    expect(['pending', 'downloading']).toContain(items[0].status);
  });

  it('returns item status by id', () => {
    const items = downloadQueue.enqueue([
      { id: 'q-2', documentId: 'doc-def' },
    ]);
    const status = downloadQueue.getStatus(items[0].id);
    expect(status).toBeDefined();
    expect(status!.documentId).toBe('doc-def');
  });

  it('returns undefined for unknown id', () => {
    expect(downloadQueue.getStatus('no-such-id')).toBeUndefined();
  });
});
