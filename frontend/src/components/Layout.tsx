/*
 * Layout.tsx
 * Shell component rendering the top navigation bar with active-link highlighting,
 * credit balance display, and an AccountSwitcher in Electron or a logout button on
 * the web. All protected pages are wrapped in this component.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';
import AccountSwitcher from './AccountSwitcher';
import type { ElectronAccount } from '../types/electron';

const isElectron = !!window.electronAPI?.isElectron; // determines whether to show AccountSwitcher vs. plain logout

export default function Layout({ children }: { children: React.ReactNode }) {
  const { email, logout, login } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(isElectron ? '/accounts' : '/login');
  };

  const handleSwitchAccount = async (acc: ElectronAccount) => {
    try {
      const pw = await window.electronAPI!.accounts.getPassword(acc.id); // decrypt via IPC — never stored in renderer memory
      await login(acc.email, pw);
      navigate('/search');
    } catch {
      navigate('/accounts'); // if login fails, redirect to account management
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-brand">MCA Document Downloader</span>

        {email && (
          <nav className="topbar-nav">
            <NavLink to="/search"    className={({ isActive }) => isActive ? 'active' : ''}>Search</NavLink>
            <NavLink to="/orders"    className={({ isActive }) => isActive ? 'active' : ''}>Orders</NavLink>
<NavLink to="/profile"   className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink>
            {isElectron && (
              <NavLink to="/accounts" className={({ isActive }) => isActive ? 'active' : ''}>Accounts</NavLink>
            )}

            {credits !== null && (
              <span
                className="text-sm"
                style={{
                  padding: '3px 10px',
                  background: 'var(--accent, #00bcd4)',
                  color: '#000',
                  borderRadius: 4,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
                title="DOWN_DOCS credits remaining"
              >
                {credits.available} credits
              </span>
            )}

            {isElectron ? (
              <AccountSwitcher onSwitch={handleSwitchAccount} />
            ) : (
              <>
                <span className="text-dim text-sm" style={{ padding: '0 8px' }}>{email}</span>
                <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Logout</button>
              </>
            )}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
