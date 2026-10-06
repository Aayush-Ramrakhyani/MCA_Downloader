import { useState, useEffect } from 'react';
import { accountApi, type UserProfile, type CreditBalance } from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      accountApi.getProfile().then(r => setProfile(r.data.data ?? null)).catch(() => {}),
      accountApi.getCredits().then(r => setCredits(r.data.data ?? null)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>;

  return (
    <div className="page">
      <h2 style={{ marginBottom: 24 }}>Account Profile</h2>

      {profile && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Email',       profile.email],
                ['Display Name',profile.displayName],
                ['Full Name',   profile.fullName],
                ['Designation', profile.designation],
                ['Company',     profile.companyName],
                ['Mobile',      profile.mobile],
                ['Website',     profile.website],
              ].filter(([, v]) => v && v !== 'null' && v !== 'undefined').map(([label, value]) => (
                <tr key={label as string}>
                  <td className="text-dim text-sm" style={{ padding: '8px 16px 8px 0', whiteSpace: 'nowrap' }}>{label}</td>
                  <td className="text-sm" style={{ padding: '8px 0' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {credits && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px' }}>Credit Balance</h3>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div className="text-dim text-sm">Available</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent, #00bcd4)' }}>
                {credits.available}
              </div>
            </div>
            {credits.used > 0 && (
              <div>
                <div className="text-dim text-sm">Used</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{credits.used}</div>
              </div>
            )}
            {credits.total > 0 && (
              <div>
                <div className="text-dim text-sm">Total</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{credits.total}</div>
              </div>
            )}
          </div>
          <div className="text-dim text-sm" style={{ marginTop: 12 }}>Plan: {credits.code}</div>
        </div>
      )}

      {!profile && !credits && (
        <div className="alert alert-warn">Could not load profile data from Finanvo.</div>
      )}
    </div>
  );
}
