/*
 * App.tsx
 * Root component: wraps the app in AuthProvider and defines all client-side routes,
 * gating protected pages behind ProtectedRoute and adapting the default home route
 * depending on whether the app runs inside Electron.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import DocumentsPage from './pages/DocumentsPage';
import OrdersPage from './pages/OrdersPage';
import StatusPage from './pages/StatusPage';
import AccountsPage from './pages/AccountsPage';
import ProfilePage from './pages/ProfilePage';
import AutoDownloadPage from './pages/AutoDownloadPage';

const isElectron = !!window.electronAPI?.isElectron; // controls Electron-only routes like /accounts

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>;
  if (!token) return <Navigate to={isElectron ? '/accounts' : '/login'} replace />; // Electron starts at /accounts; web at /login
  return <>{children}</>;
}

function AppRoutes() {
  const { token } = useAuth();
  const home = token ? '/search' : (isElectron ? '/accounts' : '/login');

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/search" replace /> : <LoginPage />} />

      {isElectron && (
        <Route path="/accounts" element={<Layout><AccountsPage /></Layout>} />
      )}

      <Route path="/auto-download"   element={<ProtectedRoute><Layout><AutoDownloadPage /></Layout></ProtectedRoute>} />
      <Route path="/search"         element={<ProtectedRoute><Layout><SearchPage /></Layout></ProtectedRoute>} />
      <Route path="/documents/:cin" element={<ProtectedRoute><Layout><DocumentsPage /></Layout></ProtectedRoute>} />
      <Route path="/orders"         element={<ProtectedRoute><Layout><OrdersPage /></Layout></ProtectedRoute>} />
      <Route path="/profile"         element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/status"          element={<ProtectedRoute><Layout><StatusPage /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
