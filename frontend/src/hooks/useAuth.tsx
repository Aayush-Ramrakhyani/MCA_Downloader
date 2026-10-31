/*
 * useAuth.tsx
 * React context and hook providing authentication state (token, email, loading) and
 * login/logout actions. Validates an existing token against the backend on mount and
 * persists the JWT in localStorage.
 */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface AuthState {
  email: string | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    email: null,
    token: localStorage.getItem('mca_token'), // hydrate immediately to avoid flash of unauthenticated UI
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('mca_token');
      if (!token) { setState(s => ({ ...s, loading: false })); return; }
      try {
        const res = await authApi.status(); // verify the stored token is still valid server-side
        setState({ email: res.data.data?.email ?? null, token, loading: false });
      } catch {
        localStorage.removeItem('mca_token'); // token expired or invalid — force re-login
        setState({ email: null, token: null, loading: false });
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const d = res.data.data!;
    localStorage.setItem('mca_token', d.token);
    setState({ email: d.email, token: d.token, loading: false });
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('mca_token');
    setState({ email: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
