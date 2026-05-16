import { useState, useCallback } from 'react';

const STORAGE_KEY = 'lorenqo-auth-token';

function parseToken(token, { allowExpired = false } = {}) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!allowExpired && payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const user = parseToken(token);

  // Parse the stored token even if expired — tells us the role/name for better error UX
  const expiredUser = user ? null : parseToken(token, { allowExpired: true });

  const login = useCallback((newToken) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  return { token, user, expiredUser, login, logout, isAdmin: user?.role === 'admin', isContact: user?.role === 'contact' };
}
