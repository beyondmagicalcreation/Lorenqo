import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lorenqo';

const LANG_OPTIONS = [
  { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ma', label: 'Darija', flag: '🇲🇦' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function JoinProject({ onLogin, isAdminViewing = false }) {
  const { token } = useParams();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRelogin, setIsRelogin] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/auth/validate/${token}`);
        const data = await res.json();
        if (!res.ok) { setTokenValid(false); setError(data.error); return; }
        setTokenValid(true);
        setProjectName(data.projectName || '');
        if (data.contactName) setName(data.contactName);
        if (data.contactLanguage) setLanguage(data.contactLanguage);
        if (data.isRelogin) {
          setIsRelogin(true);
          // Auto-login — no need to fill in the form again
          await doLogin(data.contactLanguage || 'en');
        }
      } catch {
        setTokenValid(false);
        setError('Connection error. Please try again.');
      }
    }
    if (token) validate();
  }, [token]);

  const doLogin = async (lang) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: '', language: lang }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Sign in failed'); setLoading(false); return; }
      if (isAdminViewing) {
        alert(`✓ This is a re-login link for an existing contact.\n\nYour admin session is still active.`);
        setLoading(false);
        return;
      }
      onLogin(data.token);
      navigate('/');
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), language }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Sign in failed'); return; }
      if (isAdminViewing) {
        alert(`✓ Link works! Contact "${name}" would log in as ${language.toUpperCase()}.\n\nYour admin session is still active. Log out first to test as a real contact.`);
        return;
      }
      onLogin(data.token);
      navigate('/');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null || (tokenValid && isRelogin && loading)) {
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mx-auto">
            <span className="text-accent font-bold text-xl">L</span>
          </div>
          <p className="text-muted text-sm">{isRelogin ? 'Signing you back in…' : 'Checking invitation…'}</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-8 w-full max-w-sm border border-white/10 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Invalid invitation</h2>
          <p className="text-muted text-sm">{error || 'This link is invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">L</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          {projectName && (
            <p className="text-muted text-sm mt-1">
              Invited to: <span className="text-accent font-medium">{projectName}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted block mb-2">YOUR NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amine Benali"
              className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
              autoFocus
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-2">PREFERRED LANGUAGE</label>
            <div className="grid grid-cols-2 gap-2">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-colors ${
                    language === l.value
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-white/10 text-muted hover:border-white/20'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <span className="text-sm font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
          >
            {loading ? 'Joining…' : 'Start chatting'}
          </button>
        </form>
      </div>
      <div className="mt-4">
        <Footer />
      </div>
    </div>
  );
}
