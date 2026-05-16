import React, { useState } from 'react';
import { v4 as uuidv4 } from '../uuid-shim.js';

const LANG_OPTIONS = [
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱', color: '#3B82F6' },
  { value: 'ma', label: 'Darija (Marokkaans)', flag: '🇲🇦', color: '#E87B1E' },
  { value: 'fr', label: 'Français', flag: '🇫🇷', color: '#1D4ED8' },
];

const COLORS = ['#E87B1E', '#3B82F6', '#3FB950', '#A855F7', '#EC4899', '#14B8A6'];

// uuid v4 shim using crypto if available
function genId() {
  try { return uuidv4(); } catch { return Math.random().toString(36).slice(2); }
}

export default function LoginModal({ onLogin }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('nl');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin({
      id: `user-${genId()}`,
      name: name.trim(),
      language,
      avatarColor: color,
    });
  };

  return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">L</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Lorenqo</h1>
          <p className="text-muted text-sm mt-1">Language. Communication. Global.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted block mb-2">JE NAAM</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Jan de Vries"
              className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-2">VOORKEURSTAAL</label>
            <div className="space-y-2">
              {LANG_OPTIONS.map((l) => (
                <label
                  key={l.value}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                    language === l.value
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={l.value}
                    checked={language === l.value}
                    onChange={() => setLanguage(l.value)}
                    className="hidden"
                  />
                  <span className="text-xl">{l.flag}</span>
                  <span className="text-sm font-medium text-foreground">{l.label}</span>
                  {language === l.value && (
                    <svg className="w-4 h-4 text-accent ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-2">AVATAR KLEUR</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Chatten
          </button>
        </form>
      </div>
    </div>
  );
}
