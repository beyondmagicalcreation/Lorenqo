import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lorenqo-install-dismissed';

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if user already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Only mobile
    if (window.innerWidth >= 768) return;

    // Use the prompt captured in index.html before React mounted
    const deferred = window.deferredInstallPrompt;
    if (deferred) {
      setPrompt(deferred);
      setVisible(true);
    }
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      window.deferredInstallPrompt = null;
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 z-40 md:hidden flex items-center gap-3 px-4 py-3 bg-[#161B22] border-t border-white/10"
      style={{ bottom: '64px' }}
    >
      <p className="flex-1 text-xs text-foreground/80 leading-snug">
        Install Lorenqo on your phone for the best experience
      </p>
      <button
        onClick={handleInstall}
        className="flex-shrink-0 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
