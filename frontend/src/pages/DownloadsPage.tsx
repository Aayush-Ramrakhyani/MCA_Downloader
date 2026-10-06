import { useState, useEffect } from 'react';
import { downloadsApi } from '../services/api';
import DownloadList from '../components/DownloadList';
import IntegrationBadge from '../components/IntegrationBadge';
import type { QueueItem } from '../types';

const isElectron = !!window.electronAPI?.isElectron;

export default function DownloadsPage() {
  const [active, setActive] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadDir, setDownloadDir] = useState<string>('');

  useEffect(() => {
    if (isElectron) {
      window.electronAPI!.getDownloadDir().then(setDownloadDir);
    }
  }, []);

  const handleBrowseFolder = async () => {
    const selected = await window.electronAPI!.selectFolder();
    if (selected) {
      setDownloadDir(selected);
      await window.electronAPI!.setDownloadDir(selected);
    }
  };

  const fetchAll = () => {
    downloadsApi.getAll()
      .then(res => {
        setActive(res.data.data?.active ?? []);
        setHistory(res.data.data?.history ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Downloads</h2>
        <IntegrationBadge status="MISSING_API" />
        <span className="spacer" />
        <button className="btn btn-sm btn-secondary" onClick={fetchAll}>Refresh</button>
      </div>

      {/* Download folder picker — only visible in Electron */}
      {isElectron && (
        <div className="card mb-16">
          <div className="card-title">Save Location</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input"
              value={downloadDir}
              onChange={e => setDownloadDir(e.target.value)}
              placeholder="Select a folder…"
              readOnly
            />
            <button className="btn btn-secondary" onClick={handleBrowseFolder}>
              Browse…
            </button>
          </div>
        </div>
      )}

      <div className="alert alert-warn">
        <strong>Download API not yet configured.</strong><br />
        Capture the download request from DevTools and implement{' '}
        <code>downloadDocument()</code> in{' '}
        <code>backend/src/services/finanvo/download.service.ts</code>.
      </div>

      {loading && <div className="empty-state"><span className="spinner" /></div>}

      {!loading && (
        <>
          {active.length > 0 && (
            <div className="card mt-16">
              <div className="card-title">Active Queue ({active.length})</div>
              <DownloadList items={active} />
            </div>
          )}

          <div className="card mt-16">
            <div className="card-title">Download History</div>
            {history.length === 0 ? (
              <div className="text-dim">No completed downloads yet.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Document ID</th>
                      <th>File Name</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history as Record<string, unknown>[]).map((d, i) => (
                      <tr key={String(d['id'] ?? i)}>
                        <td className="mono text-sm">{String(d['documentId'] ?? '—')}</td>
                        <td>{String(d['fileName'] ?? '—')}</td>
                        <td>
                          <span className={`badge ${
                            d['status'] === 'completed' ? 'badge-active' :
                            d['status'] === 'failed' ? 'badge-inactive' : 'badge-pending'
                          }`}>{String(d['status'] ?? '—')}</span>
                        </td>
                        <td className="text-dim text-sm">
                          {d['createdAt']
                            ? new Date(Number(d['createdAt'])).toLocaleDateString('en-IN')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
