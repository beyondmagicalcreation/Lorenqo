import { useState, useEffect } from 'react';

const MAILTO = 'mailto:hello@lorenqo.app?subject=Lorenqo Access Request';
const MAILTO_ENTERPRISE = 'mailto:hello@lorenqo.app?subject=Lorenqo Enterprise Inquiry';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Auto-translation',
    desc: 'Every message is instantly translated to all 4 languages.',
  },
  {
    icon: '💬',
    title: 'Real-time chat',
    desc: 'Messages arrive instantly, just like a regular chat app.',
  },
  {
    icon: '📱',
    title: 'Works on mobile',
    desc: 'Open any invite link on your phone and start chatting.',
  },
  {
    icon: '🔒',
    title: 'Invite-only',
    desc: 'Only your trusted contacts can join — nobody else.',
  },
];

const PLANS = [
  {
    name: 'Personal',
    price: '€19',
    period: '/mo',
    desc: 'For families and personal use',
    features: ['Up to 5 contacts', 'NL / Darija / FR / EN', 'File sharing', 'Mobile app'],
    cta: 'Get Started',
    href: MAILTO,
    popular: false,
  },
  {
    name: 'Business',
    price: '€50',
    period: '/mo',
    desc: 'For small businesses',
    features: [
      'Up to 25 contacts',
      'NL / Darija / FR / EN',
      'File & image sharing',
      'Multiple projects',
      'Priority support',
    ],
    cta: 'Get Started',
    href: MAILTO,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For larger organizations',
    features: [
      'Unlimited contacts',
      'Custom languages',
      'Dedicated support',
      'Custom integration',
    ],
    cta: 'Contact us',
    href: MAILTO_ENTERPRISE,
    popular: false,
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Choose your plan',
    desc: 'Pick Personal, Business or Enterprise depending on your needs.',
  },
  {
    n: '02',
    title: 'Send invitations',
    desc: 'Share a link with your contacts via WhatsApp — they just tap to join.',
  },
  {
    n: '03',
    title: 'Start chatting',
    desc: 'Everyone types in their own language. Lorenqo handles the rest.',
  },
];

const DIVIDER = { borderTop: '1px solid rgba(255,255,255,0.06)' };
const PILL_STYLE = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
};
const CARD_STYLE = {
  background: 'rgba(139,92,246,0.05)',
  border: '1px solid rgba(139,92,246,0.18)',
};
const SURFACE = { background: '#0d0a1a' };
const MUTED = { color: 'rgba(255,255,255,0.45)' };
const GRAD_BTN = { background: 'linear-gradient(90deg, #7c3aed, #d946ef)' };

export default function LandingPage({ expiredUser }) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (!document.querySelector('[data-inter]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      link.setAttribute('data-inter', '1');
      document.head.appendChild(link);
    }
  }, []);

  const handleOpenLink = () => {
    const url = inviteLink.trim();
    if (url) window.location.href = url;
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#07040f',
        color: 'white',
        minHeight: '100vh',
      }}
    >
      {/* Expired session banners */}
      {expiredUser?.role === 'admin' && (
        <div
          className="text-sm text-center py-2.5 px-4"
          style={{
            background: 'rgba(245,158,11,0.1)',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
            color: '#fcd34d',
          }}
        >
          Your admin session expired.{' '}
          <a href="/admin" className="underline underline-offset-2 hover:opacity-80">
            Sign in again →
          </a>
        </div>
      )}
      {expiredUser?.role === 'contact' && (
        <div
          className="text-sm text-center py-2.5 px-4"
          style={{
            background: 'rgba(139,92,246,0.1)',
            borderBottom: '1px solid rgba(139,92,246,0.2)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Hi {expiredUser.name}, your session expired. Ask your admin to resend your invite link.
        </div>
      )}

      {/* Subtle top-of-page gradient decoration */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 h-[500px]"
        style={{
          background:
            'radial-gradient(ellipse at 15% 0%, rgba(139,92,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 0%, rgba(217,70,239,0.12) 0%, transparent 55%)',
          zIndex: 0,
        }}
      />

      {/* ── Nav ────────────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={GRAD_BTN}
          >
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Lorenqo</span>
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          className="text-sm font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'white')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        >
          I have a link →
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center">

          {/* Left */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-8"
              style={{
                border: '1px solid rgba(139,92,246,0.45)',
                background: 'rgba(139,92,246,0.08)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#a78bfa' }}
              />
              <span className="text-white text-xs font-medium tracking-wide">
                Real-time translation
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-black leading-[1.06] tracking-tight mb-6">
              <span className="text-white block">Talk business.</span>
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #a78bfa 0%, #e879f9 50%, #fb923c 100%)',
                }}
              >
                In any language.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg leading-relaxed mb-8 max-w-lg" style={MUTED}>
              Close deals with Moroccan partners, stay close to family abroad — Lorenqo
              translates everything instantly between Dutch, Darija, French and English.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <a
                href={MAILTO}
                className="inline-flex items-center font-semibold px-6 py-3 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
                style={GRAD_BTN}
              >
                Get Started
              </a>
              <button
                onClick={() => setShowLinkModal(true)}
                className="inline-flex items-center font-medium px-6 py-3 rounded-xl text-sm transition-colors hover:bg-white/5"
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                I have a link →
              </button>
            </div>

            {/* Language pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { flag: '🇳🇱', label: 'Nederlands' },
                { flag: '🇲🇦', label: 'Darija' },
                { flag: '🇫🇷', label: 'Français' },
                { flag: '🇬🇧', label: 'English' },
              ].map(({ flag, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-white text-sm px-3.5 py-1.5 rounded-full"
                  style={PILL_STYLE}
                >
                  <span>{flag}</span>
                  <span>{label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow */}
              <div
                className="absolute -inset-10 blur-3xl pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(139,92,246,0.35) 0%, rgba(217,70,239,0.2) 45%, transparent 70%)',
                }}
              />

              {/* Phone shell */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: '256px',
                  height: '510px',
                  background: '#0a0718',
                  border: '1.5px solid rgba(255,255,255,0.09)',
                  borderRadius: '2.5rem',
                  boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
                }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-5 pb-1">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 500 }}>
                    9:41
                  </span>
                  {/* Notch */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-0"
                    style={{
                      width: '72px',
                      height: '22px',
                      background: '#07040f',
                      borderRadius: '0 0 16px 16px',
                    }}
                  />
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>●●●</div>
                </div>

                {/* Chat header bar */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={GRAD_BTN}
                  >
                    L
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold leading-none">Lorenqo</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px' }}>
                      Auto-translating
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="px-3 py-4 space-y-4">

                  {/* Incoming — Darija */}
                  <div className="flex flex-col items-start gap-1">
                    <div
                      className="max-w-[85%] px-3 py-2 text-white text-xs leading-relaxed"
                      style={{
                        background: 'rgba(139,92,246,0.18)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        borderRadius: '14px 14px 14px 2px',
                      }}
                    >
                      سلام! واش كاين التقرير؟
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px', marginLeft: '4px' }}>
                      Hoe zit het met het rapport?
                    </p>
                  </div>

                  {/* Outgoing — Dutch */}
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className="max-w-[85%] px-3 py-2 text-white text-xs leading-relaxed"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
                        borderRadius: '14px 14px 2px 14px',
                      }}
                    >
                      Ja, ik stuur het vandaag!
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px', marginRight: '4px' }}>
                      نعم، سأرسله اليوم!
                    </p>
                  </div>

                  {/* Incoming */}
                  <div className="flex flex-col items-start gap-1">
                    <div
                      className="max-w-[85%] px-3 py-2 text-white text-xs leading-relaxed"
                      style={{
                        background: 'rgba(139,92,246,0.18)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        borderRadius: '14px 14px 14px 2px',
                      }}
                    >
                      شكرا بزاف! 🙏
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px', marginLeft: '4px' }}>
                      Dank je wel!
                    </p>
                  </div>

                  {/* Outgoing */}
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className="max-w-[85%] px-3 py-2 text-white text-xs leading-relaxed"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
                        borderRadius: '14px 14px 2px 14px',
                      }}
                    >
                      Geen probleem! 😊
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px', marginRight: '4px' }}>
                      بلا مشكل!
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', letterSpacing: '0.1em' }}>
                      ⚡ AUTO-TRANSLATED
                    </span>
                    <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20" style={DIVIDER}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Everything you need</h2>
          <p className="mt-3 text-base" style={MUTED}>Built for seamless multilingual communication</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl p-6" style={CARD_STYLE}>
              <span className="text-2xl mb-4 block">{f.icon}</span>
              <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={MUTED}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20" style={DIVIDER}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Simple pricing</h2>
          <p className="mt-3 text-base" style={MUTED}>Start small, scale as you grow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div key={plan.name} className="relative">
              {/* Gradient border for popular card */}
              {plan.popular && (
                <div
                  className="absolute -inset-px rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #d946ef)', zIndex: 0 }}
                />
              )}
              <div
                className="relative rounded-2xl p-8 flex flex-col h-full"
                style={{ ...SURFACE, zIndex: 1, border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.08)' }}
              >
                {plan.popular && (
                  <span
                    className="self-start text-white text-xs font-semibold px-3 py-1 rounded-full mb-5"
                    style={GRAD_BTN}
                  >
                    Most popular
                  </span>
                )}

                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm mb-5" style={MUTED}>{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-7">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm" style={MUTED}>{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: '#a78bfa' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className="block text-center text-white font-semibold text-sm py-3 rounded-xl transition-opacity hover:opacity-90"
                  style={
                    plan.popular
                      ? GRAD_BTN
                      : { border: '1px solid rgba(255,255,255,0.15)' }
                  }
                >
                  {plan.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20" style={DIVIDER}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">How it works</h2>
          <p className="mt-3 text-base" style={MUTED}>Up and running in minutes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span
                className="block text-5xl font-black mb-4 bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #e879f9)' }}
              >
                {step.n}
              </span>
              <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={MUTED}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
        style={{ ...DIVIDER, color: 'rgba(255,255,255,0.28)' }}
      >
        <p>
          Made with ❤️ by{' '}
          <a
            href="https://mijnaistudio.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            MijnAIStudio.nl
          </a>
        </p>
        <p>© 2026 Lorenqo</p>
      </footer>

      {/* ── "I have a link" modal ───────────────────────────────────────────────── */}
      {showLinkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLinkModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8"
            style={{ background: '#0d0a1a', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 className="text-white font-bold text-lg mb-1">Open your invite</h3>
            <p className="text-sm mb-6" style={MUTED}>
              Paste the invite link your admin sent you via WhatsApp.
            </p>
            <input
              type="url"
              placeholder="https://..."
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleOpenLink(); }}
              autoFocus
              className="w-full text-white text-sm px-4 py-3 rounded-xl mb-4 outline-none focus:ring-1 focus:ring-violet-500"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <button
              onClick={handleOpenLink}
              className="w-full text-white font-semibold py-3 rounded-xl mb-3 text-sm transition-opacity hover:opacity-90"
              style={GRAD_BTN}
            >
              Open link →
            </button>
            <button
              onClick={() => setShowLinkModal(false)}
              className="w-full text-sm py-2 transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
