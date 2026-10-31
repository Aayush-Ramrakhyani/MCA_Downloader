/*
 * AccountSwitcher.tsx
 * Electron-only dropdown in the topbar that lists all saved accounts and lets the
 * user switch the active session by clicking an avatar, fetching the stored password
 * via IPC and re-authenticating transparently.
 */
import { useState, useEffect, useRef } from 'react';
import type { ElectronAccount } from '../types/electron';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onSwitch: (account: ElectronAccount) => void;
}

export default function AccountSwitcher({ onSwitch }: Props) {
  const { email: activeEmail } = useAuth();
  const [accounts, setAccounts] = useState<ElectronAccount[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.electronAPI!.accounts.list().then(setAccounts); // refresh list each time the dropdown opens
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (acc: ElectronAccount) =>
    acc.label.slice(0, 2).toUpperCase();

  const active = accounts.find(a => a.email === activeEmail);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Active account avatar */}
      <button
        onClick={() => setOpen(o => !o)}
        title={active?.label ?? 'Accounts'}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: active?.color ?? 'var(--accent)',
          border: '2px solid var(--border)',
          color: '#fff', fontWeight: 700, fontSize: '0.75rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'border-color 0.15s',
        }}
      >
        {active ? initials(active) : '+'}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 40, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 8, minWidth: 220,
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ padding: '4px 8px 8px', color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Accounts
          </div>

          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => { onSwitch(acc); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 10px', borderRadius: 8,
                background: acc.email === activeEmail ? 'var(--surface2)' : 'transparent',
                border: 'none', cursor: 'pointer', color: 'var(--text)',
                textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = acc.email === activeEmail ? 'var(--surface2)' : 'transparent')}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: acc.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
              }}>
                {initials(acc)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {acc.label}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {acc.email}
                </div>
              </div>
              {acc.email === activeEmail && (
                <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✓</span>
              )}
            </button>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
            <a
              href="/accounts"
              onClick={e => { e.preventDefault(); setOpen(false); window.location.href = '/accounts'; }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 8, color: 'var(--text-dim)',
                fontSize: '0.82rem', textDecoration: 'none', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ⚙ Manage accounts
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
