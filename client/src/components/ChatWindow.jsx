import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import AudioRecorder from './AudioRecorder.jsx';
import FileUpload from './FileUpload.jsx';
import Footer from './Footer.jsx';

const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Admin';

const LANG_BADGE = {
  nl: 'bg-blue-600 text-white',
  fr: 'bg-blue-900 text-white',
  ma: 'bg-accent text-white',
  en: 'bg-emerald-700 text-white',
};
const LANG_LABELS = { nl: 'NL', fr: 'FR', ma: 'MA', en: 'EN' };
const LANG_NAMES = { nl: 'Dutch', fr: 'French', ma: 'Darija', en: 'English' };

export default function ChatWindow({
  isAdmin, project, contact, currentUser, socket,
  messages, typingLabel, adminLanguage, onFilesUpdate, token,
  searchQuery, onSearchChange, threadIsRead,
}) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, searchQuery]);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const isAdminChannel = project?.id === '__admin__';

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isAdminChannel) {
      socket.sendAdminMessage('__admin__', '__admin__', trimmed, adminLanguage || 'nl');
    } else if (isAdmin) {
      if (!project || !contact) return;
      socket.sendAdminMessage(project.id, contact._id, trimmed, adminLanguage || 'nl');
    } else {
      socket.sendContactMessage(trimmed);
    }
    setText('');

    if (isAdmin) socket.sendAdminTyping(project?.id, contact?._id, false);
    else socket.sendContactTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape' && showSearch) { setShowSearch(false); onSearchChange(''); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (isAdmin && !isAdminChannel) socket.sendAdminTyping(project?.id, contact?._id, true);
    else if (!isAdmin) socket.sendContactTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (isAdmin && !isAdminChannel) socket.sendAdminTyping(project?.id, contact?._id, false);
      else if (!isAdmin) socket.sendContactTyping(false);
    }, 1500);
  };

  const uploadFile = async (file, type = 'file') => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const fileData = { fileName: data.fileName, fileSize: data.fileSize, filePath: data.filePath, type };

      if (isAdmin) {
        if (!project || (!contact && !isAdminChannel)) return;
        const targetId = isAdminChannel ? '__admin__' : contact._id;
        socket.sendAdminFileMessage(project.id, targetId, fileData);
      } else {
        socket.sendContactFileMessage(fileData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAudioReady = (blob) => {
    const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
    uploadFile(file, 'audio');
  };

  // Filter messages by search query
  const displayMessages = searchQuery
    ? messages.filter((msg) => {
        const q = searchQuery.toLowerCase();
        return (
          msg.content_original?.toLowerCase().includes(q) ||
          msg.content_nl?.toLowerCase().includes(q) ||
          msg.content_fr?.toLowerCase().includes(q) ||
          msg.content_en?.toLowerCase().includes(q) ||
          msg.content_ma_franco?.toLowerCase().includes(q) ||
          msg.sender_name?.toLowerCase().includes(q)
        );
      })
    : messages;

  // Empty state
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-accent">L</span>
          </div>
          <p className="text-foreground font-semibold">Lorenqo</p>
          <p className="text-muted text-sm">
            {isAdmin ? 'Select a project and contact to start' : 'Connecting…'}
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin && !contact && !isAdminChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <div className="text-center space-y-2">
          <p className="text-foreground font-semibold">{project.name}</p>
          <p className="text-muted text-sm">Select a contact to open the conversation</p>
        </div>
      </div>
    );
  }

  const headerTitle = isAdminChannel
    ? 'Admin Channel'
    : isAdmin
    ? `${contact.name} · ${project.name}`
    : COMPANY_NAME;

  const headerSub = isAdminChannel
    ? 'Private channel — admins only'
    : isAdmin
    ? `${LANG_LABELS[contact.language] || ''} · ${contact.online ? 'Online' : 'Offline'}`
    : project?.name || '';

  const isOwnMessage = (msg) => {
    if (isAdminChannel) return msg.sender_id === currentUser.id;
    if (isAdmin) return msg.sender_id === 'admin' || msg.sender_id?.startsWith('admin-');
    return msg.sender_id === currentUser.id;
  };

  const userLanguage = isAdmin ? (adminLanguage || 'nl') : currentUser.language;

  const inputPlaceholder = isAdminChannel
    ? 'Message the admin team…'
    : isAdmin
    ? `Message ${contact?.name || ''}…`
    : `Type in ${LANG_NAMES[currentUser?.language] || 'your language'}…`;

  return (
    <div className="flex-1 flex flex-col bg-bg min-w-0">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/5 bg-surface flex items-center justify-between flex-shrink-0 gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground truncate">{headerTitle}</h2>
          <p className="text-xs text-muted truncate">{headerSub}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search toggle */}
          <button
            onClick={() => {
              setShowSearch((v) => !v);
              if (showSearch) onSearchChange('');
            }}
            className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'text-accent bg-accent/10' : 'text-muted hover:text-foreground'}`}
            title="Search messages"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {!isAdminChannel && (
            <div className="flex gap-1">
              {['nl', 'ma', 'fr', 'en'].map((l) => (
                <span key={l} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LANG_BADGE[l]}`}>
                  {LANG_LABELS[l]}
                </span>
              ))}
            </div>
          )}
          {isAdminChannel && (
            <span className="text-xs text-muted bg-surface2 px-3 py-1 rounded-full">🔒 Private</span>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-white/5 bg-surface flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface2 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search messages…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted outline-none"
            />
            {searchQuery && (
              <span className="text-[10px] text-muted">
                {displayMessages.length} result{displayMessages.length !== 1 ? 's' : ''}
              </span>
            )}
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="text-muted hover:text-foreground">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 min-h-0 scrollbar-thin px-5 py-4 space-y-1"
        style={{
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          height: '100%',
          position: 'relative',
          overscrollBehavior: 'contain',
        }}
      >
        {displayMessages.length === 0 && searchQuery ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted text-sm">No messages matching "{searchQuery}"</p>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={isOwnMessage(msg)}
              userLanguage={isAdminChannel ? null : userLanguage}
              searchQuery={searchQuery}
              isRead={threadIsRead}
              adminLabel={!isAdmin && !isAdminChannel ? COMPANY_NAME : null}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingLabel && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex items-center gap-0.5 bg-msg-other rounded-2xl px-3 py-2">
              <span className="typing-dot text-muted" />
              <span className="typing-dot text-muted" />
              <span className="typing-dot text-muted" />
            </div>
            <p className="text-xs text-muted italic">{typingLabel} is typing…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-white/5 bg-surface flex-shrink-0">
        <div className="flex items-center gap-2 bg-surface2 rounded-2xl px-3 py-2">
          {!isAdminChannel && <FileUpload onFileSelected={(f) => uploadFile(f, 'file')} disabled={uploading} />}
          <input
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted outline-none"
            disabled={uploading}
            style={{ minHeight: '44px' }}
          />
          {!isAdminChannel && <AudioRecorder onAudioReady={handleAudioReady} disabled={uploading} />}
          <button
            onClick={handleSend}
            disabled={!text.trim() || uploading}
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-accent/80 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="md:hidden">
        <Footer />
      </div>
    </div>
  );
}
