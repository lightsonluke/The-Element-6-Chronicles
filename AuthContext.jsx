import React, { createContext, useContext, useEffect, useState } from 'react';
import db from './localBackend';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const checkAppState = async () => {
    try { setUser(await db.auth.me()); } catch { setUser(null); } finally { setIsLoadingAuth(false); }
  };
  useEffect(() => { checkAppState(); }, []);
  const navigateToLogin = async () => { const localUser = await db.auth.loginWithProvider(); setUser(localUser); };
  const logout = () => { db.auth.logout(); setUser(null); };
  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isLoadingAuth, isLoadingPublicSettings: false, authError: null, appPublicSettings: null, logout, navigateToLogin, checkAppState }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
