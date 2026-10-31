/*
 * StatusPage.tsx
 * Developer-facing page showing which Finanvo API endpoints have been implemented,
 * partially implemented, or are still missing, along with instructions for capturing
 * new endpoints from Chrome DevTools.
 */
import { useState, useEffect } from 'react';
import { integrationApi } from '../services/api';
import IntegrationBadge from '../components/IntegrationBadge';
import type { IntegrationMap } from '../types';

const DESCRIPTIONS: Record<string, string> = {
  login:             'POST /user/login — authenticates user and retrieves session token',
  companySearch:     'GET /search/company?query= — searches for Indian companies',
  cinDocuments:      'GET /company/cin-docs?cin= — fetches available documents for a CIN',
  orderCreation:     'POST /subscription/saveCinDinPayment — creates a document order',
  submitCinDocs:     'submit-cin-doc... — submits selected documents after order authorization',
  documentDownload:  'Unknown endpoint — downloads authorized documents',
};

export default function StatusPage() {
  const [status, setStatus] = useState<IntegrationMap | null>(null);

  useEffect(() => {
    integrationApi.getStatus()
      .then(res => setStatus(res.data.data ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <h2 style={{ marginBottom: 8 }}>API Integration Status</h2>
      <p className="text-dim" style={{ marginBottom: 24 }}>
        Shows which Finanvo API endpoints have been implemented, which are partially known,
        and which still need to be captured from Chrome DevTools.
      </p>

      {status && (
        <div className="card">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Endpoint / Notes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(status).map(([key, val]) => (
                <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{key}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <IntegrationBadge status={val} />
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {DESCRIPTIONS[key] ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card mt-24">
        <div className="card-title">How to add a missing API endpoint</div>
        <ol style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          <li>Open Chrome DevTools → Network → Fetch/XHR tab</li>
          <li>Enable <strong>Preserve log</strong></li>
          <li>Perform exactly ONE action on mcadownload.com</li>
          <li>Find the corresponding request in the Network tab</li>
          <li>Record: Request URL, Method, Payload, Important Request Headers, Response</li>
          <li>Update the interface in <code>backend/src/services/finanvo/types.ts</code></li>
          <li>Implement the method in the corresponding service file</li>
          <li>Remove the <code>MISSING_API_ENDPOINT</code> error throw</li>
          <li>Update <code>INTEGRATION_STATUS</code> in <code>types.ts</code></li>
        </ol>
      </div>
    </div>
  );
}
