/*
 * DocumentsPage.tsx
 * Shows the filterable document list for a CIN. In "paid order" mode (transactionId
 * in router state) it offers ZIP download; in normal mode it shows the order summary
 * panel and lets the user place an order via the Finanvo API.
 */
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { companiesApi, ordersApi, downloadsApi } from '../services/api';
import DocumentTable from '../components/DocumentTable';
import DocumentFiltersBar from '../components/DocumentFilters';
import OrderSummary from '../components/OrderSummary';
import { useDocuments } from '../hooks/useDocuments';
import type { Company, DocumentsResult, OrderCalculation } from '../types';

export default function DocumentsPage() {
  const { cin } = useParams<{ cin: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state as { company?: Company; transactionId?: string } | null;
  const company = locationState?.company ?? null;
  const transactionId = locationState?.transactionId ?? null; // present when navigating from an Orders row (enables ZIP download mode)

  const [result, setResult] = useState<DocumentsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orderCalc, setOrderCalc] = useState<OrderCalculation | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderMissingApi, setOrderMissingApi] = useState(false);

  const {
    filters, setFilters,
    filtered, categories, formIds, years,
    selectedIds, toggleSelect, selectAll, clearAll,
    selectedDocuments,
  } = useDocuments(result?.documents ?? []);

  useEffect(() => {
    if (!cin) return;
    setLoading(true);
    companiesApi.getDocuments(cin)
      .then(res => setResult(res.data.data ?? null))
      .catch(err => {
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ?? 'Failed to load documents'
        );
      })
      .finally(() => setLoading(false));
  }, [cin]);

  useEffect(() => {
    if (selectedIds.size === 0) { setOrderCalc(null); return; }
    const ids = Array.from(selectedIds);
    ordersApi.calculate(cin!, ids, result?.companyName ?? undefined)
      .then(res => setOrderCalc(res.data.data ?? null))
      .catch(() => setOrderCalc(null));
  }, [selectedIds, cin, result?.companyName]);

  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError]   = useState('');

  const handleZipDownload = async (refKeys: string[]) => {
    if (!transactionId || refKeys.length === 0) return;
    setZipLoading(true);
    setZipError('');
    try {
      const res = await downloadsApi.zipDownload(
        refKeys,
        transactionId,
        result?.companyName ?? company?.name ?? undefined,
      );
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/zip' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${result?.companyName ?? company?.name ?? 'documents'}.zip`;
      document.body.appendChild(a);
      a.click(); // programmatic click to trigger the browser's save dialog
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url); // release the object URL to free memory
    } catch {
      setZipError('Download failed. Make sure these documents are included in your paid order.');
    } finally {
      setZipLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    setOrderError('');
    setOrderMissingApi(false);
    try {
      const res = await ordersApi.place(cin!, Array.from(selectedIds));
      navigate('/orders', { state: { newOrder: res.data.data } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message ?? '';
      if ((err as { response?: { status?: number } }).response?.status === 501) {
        setOrderMissingApi(true); // 501 = backend explicitly signals the API endpoint is not yet implemented
      } else {
        setOrderError(msg || 'Order placement failed');
      }
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state"><span className="spinner" /><div className="mt-16">Loading documents…</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/search')}>← Back to Search</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(transactionId ? '/orders' : '/search')}>← Back</button>
        <div>
          <h2 style={{ margin: 0 }}>{result?.companyName ?? company?.name ?? cin}</h2>
          <div className="text-dim text-sm mono">{cin}</div>
        </div>
        <span className="spacer" />
        {transactionId && (
          <span className="badge badge-success" style={{ marginRight: 8 }}>Paid Order</span>
        )}
        <span className="text-dim text-sm">{result?.totalCount ?? 0} documents</span>
        {transactionId && (
          <button
            className="btn btn-primary btn-sm"
            disabled={zipLoading}
            onClick={() => handleZipDownload(filtered.map(d => d.id))}
          >
            {zipLoading ? 'Zipping…' : `↓ Download All as ZIP (${filtered.length})`}
          </button>
        )}
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          <DocumentFiltersBar
            filters={filters}
            onChange={setFilters}
            categories={categories}
            formIds={formIds}
            years={years}
            totalCount={result?.totalCount ?? 0}
            filteredCount={filtered.length}
          />
          <DocumentTable
            documents={filtered}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />
        </div>

        <div>
          {transactionId ? (
            <div className="card">
              <div className="card-title">Download as ZIP</div>

              {zipError && <div className="alert alert-danger mb-16">{zipError}</div>}

              {selectedIds.size === 0 ? (
                <div className="text-dim text-sm">
                  Select documents using the checkboxes on the left, then click Download ZIP.<br /><br />
                  Or use <strong>"Download All as ZIP"</strong> in the header to grab all filtered docs at once.
                </div>
              ) : (
                <>
                  <div className="text-sm" style={{ marginBottom: 12 }}>
                    <strong>{selectedIds.size}</strong> document{selectedIds.size !== 1 ? 's' : ''} selected
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 16 }}
                    disabled={zipLoading}
                    onClick={() => handleZipDownload(Array.from(selectedIds))}
                  >
                    {zipLoading ? 'Preparing ZIP…' : `↓ Download ${selectedIds.size} doc${selectedIds.size !== 1 ? 's' : ''} as ZIP`}
                  </button>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {selectedDocuments.map(d => (
                      <div key={d.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                        <div className="text-sm">{d.name}</div>
                        <div className="text-dim mono" style={{ fontSize: '0.75rem' }}>{d.formId} · {d.year ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {selectedIds.size === 0 ? (
                <div className="card">
                  <div className="card-title">Order Summary</div>
                  <div className="text-dim">Select documents to see the order summary.</div>
                </div>
              ) : (
                <>
                  {orderCalc && (
                    <>
                      {orderError && <div className="alert alert-danger mb-16">{orderError}</div>}
                      <OrderSummary
                        calc={orderCalc}
                        onConfirm={handlePlaceOrder}
                        loading={orderLoading}
                        disabled={selectedIds.size === 0}
                        missingApi={orderMissingApi}
                      />
                    </>
                  )}
                </>
              )}

              {selectedDocuments.length > 0 && (
                <div className="card mt-16">
                  <div className="card-title">Selected Documents ({selectedDocuments.length})</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {selectedDocuments.map(d => (
                      <div key={d.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <div className="text-sm">{d.name}</div>
                        <div className="text-dim mono" style={{ fontSize: '0.75rem' }}>{d.formId} · {d.year ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
