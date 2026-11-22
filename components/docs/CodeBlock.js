'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({
  code = '',
  language = 'text',
  filename = null,
  showLineNumbers = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className='my-5 overflow-hidden rounded-xl border border-kr0n-line bg-kr0n-black font-mono text-xs'>
      <div className='flex h-9 items-center justify-between border-b border-kr0n-line-soft bg-kr0n-canvas-raised px-4'>
        <span className='text-xs text-kr0n-muted'>
          {filename || language}
        </span>

        <button
          type='button'
          onClick={handleCopy}
          aria-label='Copy code to clipboard'
          className='flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-sans text-kr0n-muted hover:text-kr0n-text hover:bg-kr0n-surface-2 transition-colors duration-150 cursor-pointer'
        >
          {copied ? (
            <>
              <Check size={12} className='text-kr0n-healthy' />
              <span className='text-kr0n-healthy'>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className='overflow-x-auto p-4'>
        <pre className='flex leading-6 text-kr0n-text-secondary'>
          {showLineNumbers && (
            <div
              aria-hidden='true'
              className='select-none pr-4 text-right text-kr0n-faint flex flex-col font-mono text-xs tabular-nums'
            >
              {lines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
          )}
          <code className='flex-1 font-mono'>{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
}
