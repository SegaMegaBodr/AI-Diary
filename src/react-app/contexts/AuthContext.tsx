import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface NotionUserData {
  name?: string;
  avatar_url?: string;
}

export interface User {
  id: string;
  notion_user_data?: NotionUserData;
}

interface AuthContextType {
  user: User | null;
  redirectToLogin: () => Promise<void>;
  logout: () => Promise<void>;
  exchangeCodeForSessionToken: () => Promise<void>;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsPending(false));
  }, []);

  const redirectToLogin = async () => {
    const res = await fetch('/api/oauth/notion/redirect_url');
    const data = await res.json();
    window.location.href = data.redirectUrl;
  };

  const exchangeCodeForSessionToken = async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (!code) throw new Error('No code');
    await fetch('/api/oauth/notion/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const me = await fetch('/api/users/me');
    if (me.ok) setUser(await me.json());
  };

  const logout = async () => {
    await fetch('/api/logout');
    setUser(null);
  };

  const value = { user, redirectToLogin, logout, exchangeCodeForSessionToken, isPending };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
