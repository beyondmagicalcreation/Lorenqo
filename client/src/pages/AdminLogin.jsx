import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lorenqo';
const APP_TAGLINE = import.meta.env.VITE_APP_TAGLINE || 'Language. Communication. Global.';

export default function AdminLogin({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Sign in failed'); return; }
      onLogin(data.token);
      navigate('/');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-8 w-full max-w-sm border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="text-muted text-sm mt-1">Admin access · {APP_TAGLINE}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted block mb-2">NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linda"
              autoFocus
              className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
              style={{ minHeight: '44px' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted block mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
              style={{ minHeight: '44px' }}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={!password.trim() || loading}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <div className="mt-4">
        <Footer />
      </div>
    </div>
  );
}
