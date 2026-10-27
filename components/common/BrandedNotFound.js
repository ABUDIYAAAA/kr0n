'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Search } from 'lucide-react';

export default function BrandedNotFound({
  type = 'Resource',
  id,
  backHref = '/projects',
  backLabel = 'Back to Projects',
}) {
  return (
    <div className='flex-1 flex items-center justify-center p-6 sm:p-12 min-h-[60vh] bg-kr0n-canvas text-kr0n-text'>
      <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 sm:p-8 space-y-6 text-center'>
        <div className='w-12 h-12 border border-kr0n-line bg-kr0n-canvas-raised flex items-center justify-center mx-auto text-amber-400'>
          <AlertTriangle size={20} />
        </div>

        <div className='space-y-2'>
          <div className='text-[10px] font-mono uppercase tracking-widest text-kr0n-text-secondary font-bold'>
            404 — {type.toUpperCase()} NOT FOUND
          </div>
          <h1 className='text-xl sm:text-2xl font-bold font-mono text-white'>
            {type} Unavailable
          </h1>
          <p className='text-xs text-kr0n-text-secondary leading-relaxed font-sans'>
            The requested {type.toLowerCase()}{' '}
            {id ? (
              <code className='px-1.5 py-0.5 border border-kr0n-line bg-kr0n-black text-white font-mono text-[11px]'>
                {id}
              </code>
            ) : null}{' '}
            does not exist in workspace <span className='text-white font-mono font-medium'>kr0n-labs</span>, or has been removed.
          </p>
        </div>

        <div className='pt-2 flex flex-col sm:flex-row items-center justify-center gap-3'>
          <Link
            href={backHref}
            className='clipped-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
          >
            <ArrowLeft size={13} />
            <span>{backLabel}</span>
          </Link>
          <Link
            href='/dashboard'
            className='w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-kr0n-line hover:border-kr0n-line-strong text-xs font-mono text-kr0n-text-secondary hover:text-white transition-colors font-medium'
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
