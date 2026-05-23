import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lorenqo-install-dismissed';

function isAndroidChrome() {
  const ua = navigator.userAgent;
  return /Android/.test(ua) && /Chrome\//.test(ua) && !/Edg|OPR|SamsungBrowser/.test(ua);
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(() => window.deferredInstallPrompt || null);
  const [visible, setVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (isInStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.innerWidth >= 768) return;

    // ── iOS Safari — no install API, show manual instructions ──
    if (isIOS()) {
      setIsIOSDevice(true);
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    // ── Android Chrome ──────────────────────────────────────────
    if (window.deferredInstallPrompt) {
      setPrompt(window.deferredInstallPrompt);
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: show after 3 s even without the event
    let fallback;
    if (isAndroidChrome()) {
      fallback = setTimeout(() => setVisible((v) => v || true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallback);
    };
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
      {isIOSDevice ? (
        /* iOS: manual instructions */
        <p className="flex-1 text-xs text-foreground/80 leading-snug">
          Install Lorenqo: tap{' '}
          <svg className="inline w-3.5 h-3.5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {' '}then <strong className="text-foreground">"Add to Home Screen"</strong>
        </p>
      ) : (
        /* Android: native install prompt */
        <p className="flex-1 text-xs text-foreground/80 leading-snug">
          Install Lorenqo on your phone for the best experience
        </p>
      )}

      {!isIOSDevice && prompt && (
        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          Install
        </button>
      )}

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
