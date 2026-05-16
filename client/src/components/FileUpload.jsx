import React, { useRef, useState } from 'react';

export default function FileUpload({ onFileSelected, disabled }) {
  const imageRef = useRef(null);
  const docRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { onFileSelected(file); e.target.value = ''; }
    setShowMenu(false);
  };

  return (
    <div className="relative flex-shrink-0">
      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.docx,.xlsx,.mp3,.mp4,.webm"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => setShowMenu((v) => !v)}
        disabled={disabled}
        title="Attach file"
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40"
      >
        <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-10 left-0 z-20 bg-surface2 border border-white/10 rounded-xl shadow-xl overflow-hidden w-44">
            <button
              onClick={() => { imageRef.current?.click(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
            >
              <span className="text-base">📷</span>
              Photo / Image
            </button>
            <button
              onClick={() => { docRef.current?.click(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
            >
              <span className="text-base">📎</span>
              Document
            </button>
          </div>
        </>
      )}
    </div>
  );
}
