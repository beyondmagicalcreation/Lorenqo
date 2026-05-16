import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Footer from './Footer.jsx';

const TIPS = [
  'Use "Waga" as informal confirmation in Darija business conversations.',
  '"Bzzaf" means "a lot" or "very much" — ideal for expressing gratitude.',
  '"Mzyan" (good) is versatile: approval, agreement, and a compliment.',
  'In formal messages, start with "Mrhba" (welcome) or "Sbah l-khir" (good morning).',
  '"Shokran bzzaf" is warmer than a simple "merci" in professional tone.',
  '"Wach kayn shi moshkil?" = "Is there a problem?" — useful for check-ins.',
  'Darija Franco uses Latin letters with numbers: 3=ع, 7=ح, 9=ق.',
  '"Ma3qoul" means "reasonable/logical" — use it to express agreement.',
];

function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const colors = {
    pdf: 'bg-red-500/20 text-red-400',
    docx: 'bg-blue-500/20 text-blue-400',
    xlsx: 'bg-green-500/20 text-green-400',
    jpg: 'bg-purple-500/20 text-purple-400',
    png: 'bg-purple-500/20 text-purple-400',
    webm: 'bg-accent/20 text-accent',
    mp3: 'bg-accent/20 text-accent',
  };
  const cls = colors[ext] || 'bg-gray-500/20 text-gray-400';
  return (
    <div className={`w-9 h-9 rounded-lg ${cls} flex items-center justify-center flex-shrink-0`}>
      <span className="text-[9px] font-bold uppercase">{ext}</span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function RightPanel({ files, project }) {
  const [desktopNotif, setDesktopNotif] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(iv);
  }, []);

  const handleDesktopToggle = (val) => {
    setDesktopNotif(val);
    if (val && Notification.permission === 'default') Notification.requestPermission();
  };

  const fmt = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const fmtTime = (ts) => {
    if (!ts) return '';
    try { return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true }); }
    catch { return ''; }
  };

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-surface border-l border-white/5 flex flex-col overflow-y-auto scrollbar-thin h-full">
      {/* Files */}
      <div className="px-4 py-4">
        <p className="text-[10px] font-semibold text-muted tracking-widest mb-3">FILES</p>
        {files.length === 0 ? (
          <p className="text-xs text-muted italic">No files shared yet</p>
        ) : (
          <div className="space-y-2.5">
            {files.slice(0, 8).map((f) => (
              <a
                key={f.id}
                href={`/uploads/${f.file_path}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 hover:bg-white/5 rounded-lg p-1 -mx-1 transition-colors"
              >
                <FileIcon name={f.file_name} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{f.file_name}</p>
                  <p className="text-[10px] text-muted">{fmt(f.file_size)} · {fmtTime(f.created_at)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 mx-4" />

      {/* Notifications */}
      <div className="px-4 py-4">
        <p className="text-[10px] font-semibold text-muted tracking-widest mb-3">NOTIFICATIONS</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Desktop Notifications</span>
            <Toggle checked={desktopNotif} onChange={handleDesktopToggle} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 mx-4" />

      {/* Daily tip */}
      <div className="px-4 py-4 flex-1">
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
          <p className="text-[10px] font-semibold text-accent tracking-widest mb-2">DARIJA TIP</p>
          <p className="text-xs text-foreground/80 leading-relaxed transition-all duration-500">{TIPS[tipIndex]}</p>
          <div className="flex gap-1 mt-3 justify-center">
            {TIPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTipIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === tipIndex ? 'bg-accent' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </aside>
  );
}
