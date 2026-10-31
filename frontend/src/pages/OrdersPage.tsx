/*
 * OrdersPage.tsx
 * Lists the user's Finanvo transaction history. Completed orders show a
 * "Download Docs" button that navigates to DocumentsPage in ZIP-download mode.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountApi, type FinanvoTransaction } from '../services/api';

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<FinanvoTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    accountApi.getTransactions()
      .then(res => setTransactions(res.data.data?.transactions ?? []))
      .catch(() => setError('Could not load orders from Finanvo.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h2 style={{ marginBottom: 24 }}>Orders</h2>

      {loading && <div className="empty-state"><span className="spinner" /></div>}

      {error && (
        <div className="alert alert-warn">
          <strong>{error}</strong><br />
          Check your connection or try logging out and back in.
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <div>No orders found on your Finanvo account.</div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>CIN</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Total</th>
                <th>Status</th>
                <th>Order Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => {
                const raw = t.raw as Record<string, unknown>;
                const gst   = raw['GST']    ? `₹${raw['GST']}`    : '—';
                const amt   = raw['AMOUNT'] ? `₹${raw['AMOUNT']}` : (t.amount ? `₹${t.amount}` : '—');
                const total = t.amount      ? `₹${t.amount}`      : '—';
                const date  = t.createdAt   ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—';
                const canDownload = t.status === 'completed' && t.cin && t.txnId; // only completed orders with a known txnId can be downloaded
                return (
                  <tr key={t.id}>
                    <td className="text-sm">{t.companyName || '—'}</td>
                    <td className="mono text-sm">{t.cin || '—'}</td>
                    <td>{amt}</td>
                    <td>{gst}</td>
                    <td>{total}</td>
                    <td>
                      <span className={`badge badge-${t.status === 'completed' ? 'success' : 'pending'}`}>
                        {t.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-dim text-sm">{date}</td>
                    <td>
                      {canDownload && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/documents/${encodeURIComponent(t.cin)}`, {
                            state: {
                              transactionId: t.txnId,
                              company: { cin: t.cin, name: t.companyName },
                            },
                          })}
                        >
                          Download Docs
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
