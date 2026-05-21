import React, { useState } from 'react';
import { format } from 'date-fns';

const FLAG = { nl: '🇳🇱', fr: '🇫🇷', ma: '🇲🇦', en: '🇬🇧' };

function Avatar({ name, color }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ backgroundColor: color || '#E87B1E' }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function AudioPlayer({ filePath }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef(null);
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  return (
    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 min-w-[180px]">
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        {playing ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <div className="flex items-end gap-0.5 h-5">
        {[12, 18, 10, 16, 8, 14, 6, 12, 16, 10].map((h, i) => (
          <span key={i} className={`waveform-bar ${playing ? 'opacity-100' : 'opacity-50'}`}
            style={{ height: playing ? undefined : h, animationPlayState: playing ? 'running' : 'paused' }} />
        ))}
      </div>
      <audio ref={audioRef} src={`/uploads/${filePath}`} onEnded={() => setPlaying(false)} />
    </div>
  );
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

function FileAttachment({ msg }) {
  const ext = msg.file_name?.split('.').pop()?.toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    return (
      <a href={`/uploads/${msg.file_path}`} target="_blank" rel="noreferrer" className="block">
        <img
          src={`/uploads/${msg.file_path}`}
          alt={msg.file_name}
          className="max-w-[240px] max-h-[240px] rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  const icons = {
    pdf: { bg: 'bg-red-500/20', color: 'text-red-400', label: 'PDF' },
    docx: { bg: 'bg-blue-500/20', color: 'text-blue-400', label: 'DOCX' },
    xlsx: { bg: 'bg-green-500/20', color: 'text-green-400', label: 'XLSX' },
  };
  const icon = icons[ext] || { bg: 'bg-gray-500/20', color: 'text-gray-400', label: ext?.toUpperCase() };
  const fmt = (b) => !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
  return (
    <a href={`/uploads/${msg.file_path}`} target="_blank" rel="noreferrer"
      className="flex items-center gap-3 bg-black/20 rounded-lg px-3 py-2 hover:bg-black/30 transition-colors">
      <div className={`w-10 h-10 rounded ${icon.bg} flex items-center justify-center`}>
        <span className={`text-xs font-bold ${icon.color}`}>{icon.label}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate max-w-[160px]">{msg.file_name}</p>
        <p className="text-xs text-muted">{fmt(msg.file_size)}</p>
      </div>
    </a>
  );
}

// Read receipt checkmarks for admin's own messages
function ReadReceipt({ isRead }) {
  if (isRead) {
    // Blue double check — read
    return (
      <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1 12l5 5L20 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12l5 5L20 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Single gray check — sent
  return (
    <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/40 text-foreground rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function MessageBubble({ msg, isOwn, userLanguage, searchQuery, isRead, adminLabel }) {
  const [expanded, setExpanded] = useState(false);

  const time = msg.created_at ? format(new Date(msg.created_at * 1000), 'HH:mm') : '';
  const originalText = msg.content_original || '';
  const isAdminSender = msg.sender_id === 'admin' || msg.sender_id?.startsWith('admin-');
  const displayName = adminLabel && isAdminSender ? adminLabel : msg.sender_name;

  const myTranslation = (() => {
    if (!userLanguage) return null;
    const map = {
      nl: msg.content_nl,
      fr: msg.content_fr,
      ma: msg.content_ma_franco || msg.content_ma_arab,
      en: msg.content_en,
    };
    const t = map[userLanguage];
    return t && t !== originalText ? t : null;
  })();

  const allTranslations = [
    { key: 'nl',        label: 'Dutch',          flag: '🇳🇱', text: msg.content_nl,        arabic: false },
    { key: 'en',        label: 'English',         flag: '🇬🇧', text: msg.content_en,        arabic: false },
    { key: 'ma_franco', label: 'Darija (Latin)',  flag: '🇲🇦', text: msg.content_ma_franco,  arabic: false },
    { key: 'ma_arab',   label: 'Darija (Arabic)', flag: '🇲🇦', text: msg.content_ma_arab,    arabic: true  },
    { key: 'fr',        label: 'Français',        flag: '🇫🇷', text: msg.content_fr,         arabic: false },
  ].filter((t) => t.text && t.text.trim());

  const isTranslating = !!msg.translating;
  const hasTranslations = allTranslations.length > 0;

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div className="mb-1">
          <Avatar name={displayName} color={msg.avatar_color} />
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender info */}
        {!isOwn && (
          <span className="text-xs text-muted mb-1 ml-1">
            {FLAG[msg.sender_language] || ''} {displayName} · {time}
          </span>
        )}
        {isOwn && (
          <div className="flex items-center gap-1 mb-1 mr-1">
            <span className="text-xs text-muted">{time}</span>
            {msg.type === 'text' && <ReadReceipt isRead={isRead} />}
          </div>
        )}

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-2.5 ${
          isOwn ? 'bg-accent rounded-br-sm text-white' : 'bg-msg-other rounded-bl-sm text-foreground'
        }`}>
          {msg.type === 'text' && (
            <p className="text-sm leading-relaxed">
              {isTranslating && !originalText ? (
                <span className="opacity-50 italic">Translating…</span>
              ) : (
                highlight(originalText, searchQuery)
              )}
            </p>
          )}
          {msg.type === 'file' && <FileAttachment msg={msg} />}
          {msg.type === 'audio' && <AudioPlayer filePath={msg.file_path} />}
        </div>

        {/* Translation area */}
        {msg.type === 'text' && (
          <div className={`mt-1 w-full ${isOwn ? 'pr-1' : 'pl-1'}`}>
            {isTranslating && (
              <p className="text-[11px] text-muted italic">Translating…</p>
            )}

            {!isTranslating && myTranslation && (
              <p className={`text-[13px] leading-relaxed mt-1 ${
                isOwn ? 'text-white/60 text-right' : 'text-foreground/60'
              } ${userLanguage === 'ma' ? 'font-arabic' : ''}`}>
                {highlight(myTranslation, searchQuery)}
              </p>
            )}

            {!isTranslating && hasTranslations && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className={`text-[11px] mt-1 transition-colors ${
                  isOwn ? 'text-white/40 hover:text-white/60' : 'text-muted/60 hover:text-muted'
                }`}
              >
                {expanded ? '▲ Less' : `▼ All translations (${allTranslations.length})`}
              </button>
            )}

            {expanded && (
              <div className={`mt-2 text-xs rounded-xl p-3 space-y-2 ${
                isOwn ? 'bg-black/20 text-right' : 'bg-black/20'
              }`}>
                {allTranslations.map((t) => (
                  <div key={t.key} className={`flex items-start gap-2 justify-between sm:justify-start ${isOwn ? 'sm:flex-row-reverse' : ''}`}>
                    <span className="text-muted flex-shrink-0 sm:w-32">
                      {t.flag} {t.label}
                    </span>
                    <span className={`flex-1 min-w-0 text-right sm:flex-none sm:text-left text-foreground/80 ${t.arabic ? 'font-arabic sm:text-right' : ''}`}>
                      {highlight(t.text, searchQuery)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
