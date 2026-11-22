'use client';

import Link from 'next/link';

export default function SiteFooter({ onOpenCommand }) {
  return (
    <footer className='bg-[#F2F2F3] text-[#131217] overflow-hidden'>
      <div className='max-w-[1320px] mx-auto px-6 sm:px-8 pt-12 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-sm'>
        <div className='text-[#52525B]'>
          Application platform for engineering teams.
        </div>

        <nav aria-label='Footer' className='flex flex-wrap items-center gap-7 text-[#131217] font-medium'>
          <Link href='/docs' className='hover:text-[#4A8AD6] transition-colors duration-150'>
            Docs
          </Link>
          <Link href='/docs/quick-start' className='hover:text-[#4A8AD6] transition-colors duration-150'>
            Quick start
          </Link>
          <Link href='/login' className='hover:text-[#4A8AD6] transition-colors duration-150'>
            Log in
          </Link>
          <Link href='/signup' className='hover:text-[#4A8AD6] transition-colors duration-150'>
            Sign up
          </Link>
          {onOpenCommand && (
            <button
              type='button'
              onClick={onOpenCommand}
              className='text-[#52525B] hover:text-[#131217] transition-colors duration-150 cursor-pointer'
            >
              Search (⌘K)
            </button>
          )}
        </nav>
      </div>

      {/* Oversized cropped wordmark */}
      <div
        aria-hidden='true'
        className='select-none pointer-events-none leading-[0.78] font-bold tracking-[-0.06em] text-[#131217] whitespace-nowrap px-4 sm:px-6'
        style={{
          fontSize: 'clamp(6.5rem, 26vw, 24rem)',
          transform: 'translateY(24%)',
        }}
      >
        kr0n
      </div>
    </footer>
  );
}
