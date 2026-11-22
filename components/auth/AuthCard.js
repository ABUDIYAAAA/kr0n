'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Kr0nMark from '@/components/common/Kr0nMark';

export function AuthBanner({ type = 'error', message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`rounded-[6px] border px-3.5 py-2.5 text-xs flex items-start gap-2.5 leading-relaxed ${
        isError
          ? 'border-red-500/35 bg-red-500/10 text-red-300'
          : 'border-kr0n-healthy/40 bg-kr0n-healthy/10 text-kr0n-healthy'
      }`}
    >
      {isError ? (
        <AlertCircle size={15} className='shrink-0 mt-0.5 text-kr0n-error' />
      ) : (
        <CheckCircle2 size={15} className='shrink-0 mt-0.5 text-kr0n-healthy' />
      )}
      <span>{message}</span>
    </div>
  );
}

const CONTEXT_FACTS = [
  {
    label: 'Scoped GitHub access',
    detail: 'Install per organization with exact repository permissions and CSRF state verification.',
  },
  {
    label: 'Revision-tracked builds',
    detail: 'Map monorepo directories and override build commands with optimistic concurrency checks.',
  },
  {
    label: 'Teams, tokens, and audit',
    detail: 'Manage owner, admin, and member roles alongside scoped bearer tokens and an audit log.',
  },
];

export default function AuthCard({
  title,
  subtitle,
  maxWidth = 'max-w-[400px]',
  children,
  footer,
}) {
  return (
    <div className='min-h-screen bg-kr0n-canvas text-kr0n-text grid grid-cols-1 lg:grid-cols-12 font-sans'>
      {/* Left: Focused form column */}
      <div className='lg:col-span-6 flex flex-col justify-between px-6 sm:px-10 py-8'>
        <div>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white'
          >
            <Kr0nMark size={18} />
            <span className='font-mono'>kr0n</span>
          </Link>
        </div>

        <div className={`w-full ${maxWidth} mx-auto py-10 space-y-6`}>
          <div className='space-y-1.5'>
            {title && (
              <h1 className='text-2xl font-semibold tracking-tight text-white'>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className='text-sm text-kr0n-muted leading-relaxed'>{subtitle}</p>
            )}
          </div>

          <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-5'>
            {children}
          </div>

          {footer && (
            <div className='text-sm text-kr0n-muted'>{footer}</div>
          )}
        </div>

        <div className='text-xs text-kr0n-faint'>
          Session authentication backed by HttpOnly cookies.
        </div>
      </div>

      {/* Right: Quiet architectural brand panel (desktop) */}
      <aside className='hidden lg:flex lg:col-span-6 bg-kr0n-black border-l border-kr0n-line flex-col justify-between p-12 xl:p-16'>
        <div className='text-xs font-mono text-kr0n-muted'>
          kr0n control plane
        </div>

        <div className='max-w-md space-y-10'>
          <div className='space-y-3'>
            <h2 className='text-3xl font-semibold tracking-[-0.03em] leading-[1.1] text-white'>
              Push code.
              <br />
              Run as a team.
            </h2>
            <p className='text-sm text-kr0n-text-secondary leading-relaxed'>
              One control plane for GitHub repositories, monorepo build configurations, organization RBAC, and audit visibility.
            </p>
          </div>

          <dl className='divide-y divide-kr0n-line-soft border-t border-b border-kr0n-line-soft'>
            {CONTEXT_FACTS.map((fact) => (
              <div key={fact.label} className='py-4 space-y-1'>
                <dt className='text-[13px] font-medium text-white'>{fact.label}</dt>
                <dd className='text-xs text-kr0n-muted leading-relaxed'>{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className='flex items-center gap-6 text-xs text-kr0n-muted'>
          <Link href='/docs' className='hover:text-white transition-colors duration-150'>
            Documentation
          </Link>
          <Link href='/docs/quick-start' className='hover:text-white transition-colors duration-150'>
            Quick start
          </Link>
        </div>
      </aside>
    </div>
  );
}
