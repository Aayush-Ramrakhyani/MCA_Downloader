/*
 * AccountsPage.tsx
 * Electron-only account management page. Stores one Finanvo account at a time via
 * the Electron IPC accounts API, auto-logs in on launch if a saved account exists,
 * and provides a form to add or switch accounts with OS-encrypted password storage.
 */
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ElectronAccount } from '../types/electron';

// Maps raw error messages to human-readable strings for display in the accounts UI
function parseLoginError(err: Error): string {
  const msg = err.message ?? '';
  if (msg.includes('401') || msg.includes('Invalid email') || msg.includes('INVALID_CREDENTIALS'))
    return 'Wrong email or password. Check your Finanvo credentials.';
  if (msg.includes('Network Error') || msg.includes('ECONNREFUSED'))
    return 'Cannot connect to the backend. Try restarting the app.';
  if (msg.includes('TOKEN_EXTRACTION_FAILED'))
    return 'Login succeeded but the app could not read the session token. Contact support.';
  if (msg.includes('502') || msg.includes('LOGIN_FAILED'))
    return `Finanvo login failed: ${msg}`;
  return msg;
}

export default function AccountsPage() {
  const { login, email: activeEmail, logout } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState<ElectronAccount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const api = window.electronAPI!.accounts;

  const reload = async () => {
    const list = await api.list();
    setSaved(list[0] ?? null);
    if (!list[0]) setShowForm(true);
  };

  useEffect(() => { reload(); }, []);

  const handleLogin = async () => {
    if (!saved) return;
    setError('');
    setLoading(true);
    try {
      const pw = await api.getPassword(saved.id);
      await login(saved.email, pw);
      navigate('/auto-download');
    } catch (err: unknown) {
      setError(parseLoginError(err as Error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (saved) await api.delete(saved.id);
      const acc = await api.add(email, email, password);
      setEmail(''); setPassword('');
      setShowForm(false);
      await reload();
      const pw = await api.getPassword((acc as ElectronAccount).id);
      await login((acc as ElectronAccount).email, pw);
      navigate('/auto-download');
    } catch (err: unknown) {
      setError(parseLoginError(err as Error));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const isLoggedIn = !!activeEmail;

  // ── Logged in ──────────────────────────────────────────────────
  if (isLoggedIn) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <h2 style={{ margin: 0 }}>Account</h2>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
            }}>
              {activeEmail!.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{activeEmail}</div>
              <div className="text-dim text-sm">Finanvo Account</div>
              <span className="badge badge-active" style={{ marginTop: 4 }}>Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(true)}>
              Change Account
            </button>
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleLogout}>
              Logout
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSave} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label className="label">New Finanvo Email *</label>
                <input className="input" type="email" required autoFocus placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Password *</label>
                <input className="input" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? <span className="spinner" /> : 'Save & Switch'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────
  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <h2 style={{ marginBottom: 4 }}>Welcome to MCA Document Downloader</h2>
      <p className="text-dim text-sm" style={{ marginBottom: 24 }}>Log in with your Finanvo account to get started.</p>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      {saved && !showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: saved.color,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1rem', flexShrink: 0,
            }}>
              {saved.email.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{saved.email}</div>
              <div className="text-dim text-sm">Finanvo account</div>
            </div>
            <button className="btn btn-primary" onClick={handleLogin} disabled={loading} style={{ minWidth: 80 }}>
              {loading ? <span className="spinner" /> : 'Log In'}
            </button>
          </div>
          <button className="btn btn-ghost btn-sm text-dim" style={{ marginTop: 10, width: '100%' }} onClick={() => setShowForm(true)}>
            Use a different account
          </button>
        </div>
      )}

      {showForm && (
        <div className="card">
          <div className="card-title">
            {saved ? 'Use a Different Account' : 'Add Your Finanvo Account'}
          </div>
          <p className="text-dim text-sm" style={{ marginTop: 0, marginBottom: 14 }}>
            Enter your Finanvo login credentials.
          </p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="label">Finanvo Email *</label>
              <input className="input" type="email" required autoFocus placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Password *</label>
              <input className="input" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="alert alert-info" style={{ margin: 0 }}>
              Password is encrypted with Windows DPAPI and stored only on this device.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? <span className="spinner" /> : 'Log In'}
              </button>
              {saved && (
                <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
