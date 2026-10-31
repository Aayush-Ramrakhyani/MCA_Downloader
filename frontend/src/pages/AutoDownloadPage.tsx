/*
 * AutoDownloadPage.tsx
 * Electron-only "fire-and-forget" page: on mount it fetches all completed orders,
 * then sequentially downloads each company's documents as a ZIP, shows progress,
 * and auto-logs out with a countdown when all downloads are done.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountApi, companiesApi, downloadsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { FinanvoTransaction } from '../services/api';

type JobStatus = 'pending' | 'fetching' | 'downloading' | 'done' | 'skipped' | 'error';

interface CompanyJob {
  txn: FinanvoTransaction;
  status: JobStatus;
  docCount: number;
  note: string;
}

function StatusIcon({ s }: { s: JobStatus }) {
  if (s === 'done')    return <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>;
  if (s === 'error')   return <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✗</span>;
  if (s === 'skipped') return <span className="text-dim">—</span>;
  if (s === 'pending') return <span className="text-dim" style={{ fontSize: '1.1rem' }}>○</span>;
  return <span className="spinner" style={{ width: 14, height: 14, display: 'inline-block' }} />;
}

function jobNote(job: CompanyJob): string {
  if (job.status === 'pending')     return 'Waiting...';
  if (job.status === 'fetching')    return 'Fetching documents...';
  if (job.status === 'downloading') return `Downloading ${job.docCount} docs...`;
  if (job.status === 'done')        return `${job.docCount} docs saved`;
  return job.note || job.status;
}

function triggerZipSave(data: BlobPart, name: string) {
  const url = window.URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[/\\?%*:|"<>]/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
}

export default function AutoDownloadPage() {
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [phase, setPhase]         = useState<'loading' | 'running' | 'done' | 'empty' | 'failed'>('loading');
  const [jobs, setJobs]           = useState<CompanyJob[]>([]);
  const [errorMsg, setErrorMsg]   = useState('');
  const [countdown, setCountdown] = useState(5);
  const started = useRef(false);

  const patch = (i: number, update: Partial<CompanyJob>) =>
    setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, ...update } : j));

  useEffect(() => {
    if (started.current) return; // guard against React StrictMode double-invoke
    started.current = true;

    (async () => {
      // Fetch all completed orders
      let completed: FinanvoTransaction[] = [];
      try {
        const res = await accountApi.getTransactions();
        completed = (res.data.data?.transactions ?? []).filter(t => t.status === 'Completed');
      } catch {
        setErrorMsg('Could not load your orders. Check your connection and try again.');
        setPhase('failed');
        return;
      }

      if (completed.length === 0) { setPhase('empty'); return; }

      setJobs(completed.map(txn => ({ txn, status: 'pending', docCount: 0, note: '' })));
      setPhase('running');

      // Download each company one at a time
      for (let i = 0; i < completed.length; i++) {
        const txn = completed[i];

        patch(i, { status: 'fetching' });
        let refKeys: string[] = [];
        try {
          const docsRes = await companiesApi.getDocuments(txn.cin);
          refKeys = (docsRes.data.data?.documents ?? []).map((d: { id: string }) => d.id);
        } catch {
          patch(i, { status: 'error', note: 'Failed to fetch document list' });
          continue;
        }

        if (refKeys.length === 0) {
          patch(i, { status: 'skipped', note: 'No documents found' });
          continue;
        }

        patch(i, { status: 'downloading', docCount: refKeys.length });
        try {
          const res = await downloadsApi.zipDownload(refKeys, txn.txnId, txn.companyName);
          triggerZipSave(res.data as BlobPart, txn.companyName);
          patch(i, { status: 'done', docCount: refKeys.length });
        } catch {
          patch(i, { status: 'error', note: 'ZIP download failed' });
        }
      }

      // Countdown then auto-logout (gives the user a chance to abort or stay logged in)
      setPhase('done');
      let c = 5;
      const timer = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(timer);
          logout().then(() => navigate('/accounts', { replace: true }));
        }
      }, 1000);
    })();
  }, []);

  if (phase === 'loading') {
    return (
      <div className="page" style={{ maxWidth: 520, textAlign: 'center', paddingTop: 80 }}>
        <span className="spinner" style={{ width: 36, height: 36, display: 'inline-block' }} />
        <div className="text-dim" style={{ marginTop: 16 }}>Loading your orders...</div>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <h2>No Completed Orders</h2>
        <p className="text-dim">You don't have any paid orders yet. Use Search to find companies and place an order first.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>Go to Search</button>
          <button className="btn btn-ghost" onClick={() => logout().then(() => navigate('/accounts', { replace: true }))}>Logout</button>
        </div>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>{errorMsg}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>Browse Normally</button>
          <button className="btn btn-ghost" onClick={() => logout().then(() => navigate('/accounts', { replace: true }))}>Logout</button>
        </div>
      </div>
    );
  }

  const doneCount = jobs.filter(j => j.status === 'done').length;
  const total     = jobs.length;
  const isRunning = phase === 'running';

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          {isRunning ? 'Downloading Your Documents' : 'All Downloads Complete'}
        </h2>
        <div className="text-dim" style={{ marginTop: 8, fontSize: '0.9rem' }}>
          {isRunning
            ? `${doneCount} of ${total} companies done`
            : `${doneCount} of ${total} downloaded — logging out in ${countdown}s`}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {jobs.map((job, i) => (
          <div
            key={job.txn.txnId}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < jobs.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>
              <StatusIcon s={job.status} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.txn.companyName}
              </div>
              <div className="text-dim mono" style={{ fontSize: '0.72rem' }}>{job.txn.cin}</div>
            </div>
            <div
              className="text-dim"
              style={{ fontSize: '0.8rem', flexShrink: 0, color: job.status === 'error' ? 'var(--danger)' : undefined }}
            >
              {jobNote(job)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        {phase === 'done' ? (
          <>
            <button className="btn btn-primary" onClick={() => logout().then(() => navigate('/accounts', { replace: true }))}>
              Logout Now
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/search')}>
              Stay Logged In
            </button>
          </>
        ) : (
          <button className="btn btn-ghost" onClick={() => navigate('/search')}>
            Skip &amp; Browse Normally
          </button>
        )}
      </div>
    </div>
  );
}
