import Link from 'next/link';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';

export default function ComingSoonPage({
  section = 'Workspace',
  title = 'Coming Soon',
  description = 'This feature is not yet available in the current KR0N control plane.',
  backHref = '/dashboard',
  backLabel = 'Return to Dashboard',
  secondaryHref = '/projects',
  secondaryLabel = 'Open Projects',
}) {
  return (
    <section className='flex-1 min-h-[70vh] flex items-center justify-center p-6 sm:p-10 bg-kr0n-canvas text-kr0n-text'>
      <div className='w-full max-w-xl border border-kr0n-line bg-kr0n-surface p-8 sm:p-10 text-center space-y-6'>
        <div className='flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-kr0n-muted'>
          <span>{section}</span>
          <span>/</span>
          <span className='inline-flex items-center gap-1.5 border border-kr0n-line bg-kr0n-black px-2 py-0.5 text-kr0n-warning font-bold'>
            <Clock size={10} aria-hidden='true' />
            <span>Coming Soon</span>
          </span>
        </div>

        <div className='space-y-2.5'>
          <h1 className='text-2xl font-bold font-mono uppercase tracking-tight text-white'>
            {title}
          </h1>
          <p className='text-sm text-kr0n-text-secondary leading-relaxed max-w-md mx-auto'>
            {description}
          </p>
        </div>

        <div className='pt-2 flex flex-col sm:flex-row items-center justify-center gap-3'>
          <Link
            href={backHref}
            className='clipped-btn inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors w-full sm:w-auto'
          >
            <ArrowLeft size={13} aria-hidden='true' />
            <span>{backLabel}</span>
          </Link>

          {secondaryHref && (
            <Link
              href={secondaryHref}
              className='inline-flex items-center justify-center gap-2 border border-kr0n-line hover:border-kr0n-line-strong bg-kr0n-black text-kr0n-text-secondary hover:text-white px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors w-full sm:w-auto'
            >
              <span>{secondaryLabel}</span>
              <ArrowRight size={13} aria-hidden='true' />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
