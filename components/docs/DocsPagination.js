import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function DocsPagination({ prev = null, next = null }) {
  return (
    <div className='mt-14 pt-8 border-t border-kr0n-line grid grid-cols-1 sm:grid-cols-2 gap-4'>
      {prev ? (
        <Link
          href={prev.slug}
          className='group rounded-xl border border-kr0n-line bg-kr0n-surface p-5 hover:border-kr0n-line-strong hover:bg-kr0n-surface-2/60 transition-colors duration-150 flex flex-col justify-between gap-1.5'
        >
          <div className='flex items-center gap-1.5 text-xs text-kr0n-muted'>
            <ArrowLeft size={13} />
            <span>Previous</span>
          </div>
          <span className='text-sm font-medium text-kr0n-text'>
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className='hidden sm:block' />
      )}

      {next ? (
        <Link
          href={next.slug}
          className='group rounded-xl border border-kr0n-line bg-kr0n-surface p-5 hover:border-kr0n-line-strong hover:bg-kr0n-surface-2/60 transition-colors duration-150 flex flex-col justify-between items-end text-right gap-1.5 sm:col-start-2'
        >
          <div className='flex items-center gap-1.5 text-xs text-kr0n-muted'>
            <span>Next</span>
            <ArrowRight size={13} />
          </div>
          <span className='text-sm font-medium text-kr0n-text'>
            {next.title}
          </span>
        </Link>
      ) : null}
    </div>
  );
}
