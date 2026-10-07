'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';

export default function ProjectEndpoint({ url, status = 'live', compact = false }) {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`https://${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleOpen = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className='group/endpoint relative overflow-hidden flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-kr0n-black/80 hover:bg-white/[0.04] border border-kr0n-line-soft hover:border-kr0n-line-strong transition-all'
      onClick={(e) => e.stopPropagation()}
    >
      {/* Luminous flowing glow sweep */}
      <span
        className='absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.07] to-transparent animate-link-glow'
        aria-hidden='true'
      />

      <a
        href={`https://${url}`}
        target='_blank'
        rel='noopener noreferrer'
        onClick={handleOpen}
        className='flex items-center gap-2 min-w-0 flex-1 select-text relative z-10'
        title={`Visit https://${url}`}
      >
        {/* Pulsing Status Dot with ambient glow */}
        <span className='relative flex h-2 w-2 shrink-0 items-center justify-center'>
          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60' />
          <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]' />
        </span>

        <span className='text-[10px] font-mono text-kr0n-text-secondary font-medium group-hover/endpoint:text-white transition-colors truncate tracking-wide'>
          {url}
        </span>
      </a>

      <div className='flex items-center gap-1 shrink-0 relative z-10'>
        {/* Copy button */}
        <button
          type='button'
          onClick={handleCopy}
          className='p-1 text-kr0n-muted hover:text-white transition-colors'
          title='Copy URL'
          aria-label='Copy URL'
        >
          {copied ? (
            <Check size={10} className='text-emerald-400' />
          ) : (
            <Copy size={10} className='opacity-0 group-hover/endpoint:opacity-100 transition-opacity' />
          )}
        </button>

        {/* External link with micro translation */}
        <a
          href={`https://${url}`}
          target='_blank'
          rel='noopener noreferrer'
          onClick={handleOpen}
          className='p-1 text-kr0n-muted group-hover/endpoint:text-white transition-colors'
          title='Open in new tab'
          aria-label='Open in new tab'
        >
          <ArrowUpRight
            size={11}
            className='transform group-hover/endpoint:translate-x-0.5 group-hover/endpoint:-translate-y-0.5 transition-transform duration-150'
          />
        </a>
      </div>
    </div>
  );
}
