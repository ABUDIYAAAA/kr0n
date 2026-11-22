'use client';

import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { GithubIcon } from '@/components/auth/OAuthButtons';

export default function GitHubNotConnected({
  accountEmail,
  connectError,
  connecting,
  connectGitHubApp,
}) {
  return (
    <div className='w-full max-w-5xl space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight text-white'>
            Connect GitHub
          </h1>
          <p className='text-[13px] text-kr0n-muted'>
            Install the kr0n GitHub App on your personal account or organization to authorize repository access.
          </p>
        </div>
        <Link
          href='/projects'
          className='inline-flex items-center gap-1.5 text-xs text-kr0n-muted hover:text-white transition-colors duration-150 shrink-0'
        >
          <ArrowLeft size={14} />
          <span>Projects</span>
        </Link>
      </div>

      <div className='border border-kr0n-line bg-kr0n-black rounded-[6px] p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
        <div className='lg:col-span-7 space-y-3'>
          <h2 className='text-base font-semibold text-white'>
            Authorize specific repositories
          </h2>
          <p className='text-[13px] text-kr0n-text-secondary leading-relaxed'>
            {accountEmail ? (
              <>
                Signed in as <span className='font-mono text-white'>{accountEmail}</span>. Only repositories you explicitly select during GitHub App installation will be visible to kr0n.
              </>
            ) : (
              'Only repositories you explicitly select during GitHub App installation will be visible to kr0n.'
            )}
          </p>
          {connectError && (
            <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-[6px] text-xs text-red-300 flex items-center gap-2'>
              <AlertCircle size={14} className='shrink-0 text-kr0n-error' />
              <span>{connectError}</span>
            </div>
          )}
        </div>

        <div className='lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3'>
          <button
            type='button'
            disabled={connecting}
            onClick={connectGitHubApp}
            className='h-10 px-5 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {connecting ? (
              <>
                <Loader2 size={15} className='animate-spin' />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <GithubIcon className='w-4 h-4' />
                <span>Install GitHub App</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
