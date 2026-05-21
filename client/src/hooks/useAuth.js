import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'lorenqo-auth-token';

function parseToken(token, { allowExpired = false } = {}) {
  if (!token) return null;
  try {
    // JWT uses base64url (- and _ instead of + and /); atob requires standard base64
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64));
    if (!allowExpired && payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState(() => {
    // Invite links must always show the join form — clear any existing session first
    if (window.location.pathname.startsWith('/join/')) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  });
  const user = parseToken(token);

  // Parse the stored token even if expired — tells us the role/name for better error UX
  const expiredUser = user ? null : parseToken(token, { allowExpired: true });

  const login = useCallback((newToken) => {
    if (!newToken) return;
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  // Auto-refresh contact token if it expires within 7 days — prevents needing the invite link again
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (!storedToken) return;
    const payload = parseToken(storedToken, { allowExpired: false });
    if (!payload || payload.role !== 'contact') return;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (payload.exp * 1000 - Date.now() > sevenDays) return;
    fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.token) login(data.token); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { token, user, expiredUser, login, logout, isAdmin: user?.role === 'admin', isContact: user?.role === 'contact' };
}
