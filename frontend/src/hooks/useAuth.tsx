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
    token: localStorage.getItem('mca_token'),
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('mca_token');
      if (!token) { setState(s => ({ ...s, loading: false })); return; }
      try {
        const res = await authApi.status();
        setState({ email: res.data.data?.email ?? null, token, loading: false });
      } catch {
        localStorage.removeItem('mca_token');
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
