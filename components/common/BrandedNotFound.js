'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function BrandedNotFound({
  type = 'Resource',
  id,
  backHref = '/projects',
  backLabel = 'Back to projects',
}) {
  return (
    <div className='flex-1 flex items-center justify-center p-6 sm:p-12 min-h-[60vh] bg-kr0n-canvas text-kr0n-text'>
      <div className='max-w-md w-full rounded-xl border border-kr0n-line bg-kr0n-surface p-8 space-y-6 text-center'>
        <div className='w-11 h-11 rounded-xl border border-kr0n-line bg-kr0n-black flex items-center justify-center mx-auto text-amber-400'>
          <AlertTriangle size={20} />
        </div>

        <div className='space-y-2'>
          <div className='text-xs font-mono text-kr0n-muted'>404</div>
          <h1 className='text-lg font-semibold text-kr0n-text'>
            {type} not found
          </h1>
          <p className='text-sm text-kr0n-text-secondary leading-relaxed'>
            The requested {type.toLowerCase()}{' '}
            {id ? (
              <code className='px-1.5 py-0.5 rounded border border-kr0n-line bg-kr0n-black text-kr0n-text font-mono text-xs'>
                {id}
              </code>
            ) : null}{' '}
            does not exist in the active organization or has been removed.
          </p>
        </div>

        <div className='pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5'>
          <Link
            href={backHref}
            className='w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150'
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
          <Link
            href='/dashboard'
            className='w-full sm:w-auto inline-flex items-center justify-center h-9 px-4 rounded-lg border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 text-xs font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150'
          >
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
