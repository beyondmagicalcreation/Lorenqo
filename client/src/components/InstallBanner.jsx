import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lorenqo-install-dismissed';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

const IOS_DEVICE = isIOS();

export default function InstallBanner({ isAdmin }) {
  const [prompt, setPrompt] = useState(() => window.deferredInstallPrompt || null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    if (isInStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.innerWidth >= 768) return;

    // Capture native install prompt if already available, or when it fires later
    if (window.deferredInstallPrompt) {
      setPrompt(window.deferredInstallPrompt);
    }
    const handler = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show immediately — don't wait for the native prompt
    setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isAdmin]);

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
    <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-black/60">
      <div className="w-full max-w-sm mx-auto bg-[#161B22] rounded-t-2xl border-t border-x border-white/10 shadow-2xl px-6 pt-5 pb-8">
        {/* drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">L</span>
        </div>

        <h2 className="text-lg font-bold text-foreground text-center mb-1">
          Install Lorenqo
        </h2>
        <p className="text-sm text-foreground/70 text-center mb-6 leading-relaxed">
          {IOS_DEVICE
            ? 'Add to your home screen for the full experience'
            : 'Install on your phone for quick access'}
        </p>

        {IOS_DEVICE ? (
          /* iOS: manual share-button instructions */
          <div className="bg-white/5 rounded-xl px-4 py-3 mb-5 text-sm text-center text-foreground/80 leading-relaxed">
            Tap{' '}
            <svg className="inline w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {' '}in your browser, then{' '}
            <strong className="text-foreground">"Add to Home Screen"</strong>
          </div>
        ) : prompt ? (
          /* Android: native install button — only shown when browser confirms app is installable */
          <button
            onClick={handleInstall}
            className="w-full bg-accent text-white font-semibold py-3.5 rounded-xl hover:bg-accent/90 transition-colors mb-3"
          >
            Install
          </button>
        ) : null}

        <button
          onClick={handleDismiss}
          className="w-full text-sm text-muted hover:text-foreground transition-colors py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
