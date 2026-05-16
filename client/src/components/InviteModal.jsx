import React, { useState } from 'react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lorenqo';

const LANG_OPTIONS = [
  { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ma', label: 'Darija', flag: '🇲🇦' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function InviteModal({ projectName, onGenerateInvite, onClose }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('nl');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await onGenerateInvite(name.trim() || null, language);
      const url = data.fullUrl || `${window.location.origin}${data.url}`;
      setInviteUrl(url);
    } catch {
      alert('Failed to generate link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappUrl = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Hi! Here's your invite to ${APP_NAME}:\n${inviteUrl}`)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="font-semibold text-foreground">Invite a contact</h2>
            <p className="text-xs text-muted mt-0.5">{projectName}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!inviteUrl ? (
            <>
              <div>
                <label className="text-xs font-semibold text-muted block mb-2">CONTACT NAME (optional)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amine Benali"
                  className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-2">CONTACT LANGUAGE</label>
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
                      <span className="text-xl">{l.flag}</span>
                      <span className="text-xs font-medium">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40"
              >
                {loading ? 'Generating…' : 'Generate invite link'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-surface2 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted">INVITE LINK</p>
                <p className="text-xs text-foreground break-all font-mono bg-bg rounded-lg px-3 py-2 border border-white/5">
                  {inviteUrl}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-foreground hover:bg-white/10'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy link
                      </>
                    )}
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-300">
                  <strong>Test as admin:</strong> Open the link in a private window (Ctrl+Shift+N) to test the contact experience without logging out.
                </p>
              </div>

              <button
                onClick={() => { setInviteUrl(null); setName(''); }}
                className="w-full py-2.5 rounded-xl text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Generate new link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
