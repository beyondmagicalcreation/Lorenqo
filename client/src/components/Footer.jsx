import React from 'react';

export default function Footer() {
  return (
    <div className="text-center py-1.5 text-[10px] text-muted/40 flex-shrink-0">
      Made with ❤️ by{' '}
      <a
        href="https://mijnaistudio.nl"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-muted/70 transition-colors underline underline-offset-2"
      >
        MijnAIStudio.nl
      </a>
    </div>
  );
}
