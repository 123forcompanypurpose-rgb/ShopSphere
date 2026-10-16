import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '../api/types';
import { authApi, LoginDto } from '../api/auth';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  loading: boolean;
  login: (dto: LoginDto) => Promise<Session>;
  logout: () => Promise<void>;
  updateFirstName: (firstName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleAutoLogout = (expiresAt: number) => {
    clearTimer();
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      handleAutoLogout();
    } else {
      timerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, delay);
    }
  };

  const handleAutoLogout = () => {
    localStorage.removeItem('shopsphere.session');
    setSession(null);
    toast.error('Your session has expired. Please sign in again.');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
  };

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('shopsphere.session');
      if (raw) {
        const stored: Session = JSON.parse(raw);
        if (stored.expiresAt && stored.expiresAt > Date.now()) {
          setSession(stored);
          scheduleAutoLogout(stored.expiresAt);
        } else {
          localStorage.removeItem('shopsphere.session');
        }
      }
    } catch {
      localStorage.removeItem('shopsphere.session');
    } finally {
      setLoading(false);
    }

    return () => clearTimer();
  }, []);

  const login = async (dto: LoginDto): Promise<Session> => {
    const res = await authApi.login(dto);
    const expiresAt = Date.now() + res.expiresIn * 1000;
    const newSession: Session = {
      token: res.token,
      userId: res.userId,
      email: res.email,
      firstName: res.firstName,
      role: res.role,
      expiresAt,
    };

    localStorage.setItem('shopsphere.session', JSON.stringify(newSession));
    setSession(newSession);
    scheduleAutoLogout(expiresAt);
    return newSession;
  };

  const logout = async () => {
    clearTimer();
    await authApi.logout();
    localStorage.removeItem('shopsphere.session');
    setSession(null);
  };

  const updateFirstName = (firstName: string) => {
    if (!session) return;
    const updated = { ...session, firstName };
    localStorage.setItem('shopsphere.session', JSON.stringify(updated));
    setSession(updated);
  };

  const isAuthenticated = !!session;
  const isAdmin = session?.role === 'ADMIN';
  const isCustomer = session?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        isAdmin,
        isCustomer,
        loading,
        login,
        logout,
        updateFirstName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
