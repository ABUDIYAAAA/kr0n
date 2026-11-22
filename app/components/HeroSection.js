'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, GitBranch, Folder } from 'lucide-react';
import Kr0nMark from '@/components/common/Kr0nMark';

const SHOWCASE_ROWS = [
  {
    name: 'storefront',
    repo: 'northstar-labs/storefront',
    branch: 'main',
    root: 'apps/web',
    stack: 'Next.js',
    rev: 'rev 4',
    updated: '14m ago',
  },
  {
    name: 'ledger-api',
    repo: 'northstar-labs/ledger',
    branch: 'main',
    root: 'services/api',
    stack: 'Go',
    rev: 'rev 9',
    updated: '2h ago',
  },
  {
    name: 'invoice-worker',
    repo: 'northstar-labs/ledger',
    branch: 'release',
    root: 'services/worker',
    stack: 'Python',
    rev: 'rev 2',
    updated: 'Yesterday',
  },
];

const SHOWCASE_EVENTS = [
  { action: 'project.build_settings.updated', actor: 'nadia@northstar.dev', time: '14m ago' },
  { action: 'member.role_updated', actor: 'tomasz@northstar.dev', time: '2h ago' },
  { action: 'apitoken.created', actor: 'hana@northstar.dev', time: 'Yesterday' },
];

export default function HeroSection() {
  return (
    <section className='pt-16 pb-24 sm:pt-24 sm:pb-32 px-6 sm:px-8'>
      <div className='max-w-[1320px] mx-auto space-y-16 sm:space-y-20'>
        {/* Poster-scale two-line headline + supporting sentence */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end'>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className='lg:col-span-8'
          >
            <h1
              className='font-semibold text-white tracking-[-0.04em] leading-[0.95]'
              style={{
                fontSize: 'clamp(2.85rem, 7.6vw, 6.5rem)',
                textWrap: 'balance',
              }}
            >
              Push code.
              <br />
              Run as a team.
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className='lg:col-span-4 space-y-6 pb-1'
          >
            <p className='text-base sm:text-[17px] text-kr0n-text leading-[1.55] max-w-[38ch]'>
              Connect GitHub repositories, map monorepo folders, and govern team access from one calm control plane.
            </p>
            <div className='flex flex-wrap items-center gap-6'>
              <Link
                href='/signup'
                className='inline-flex items-center gap-2 h-12 px-6 bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium transition-colors duration-150'
              >
                <span>Start building</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href='/docs'
                className='text-sm font-medium text-kr0n-text-secondary hover:text-white underline underline-offset-4 transition-colors duration-150'
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Full-width product viewport (shutter-image entrance) */}
        <motion.div
          initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0.7 }}
          animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
          transition={{ duration: 0.95, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          data-ui='true'
          className='bg-kr0n-black rounded-[6px] overflow-hidden'
        >
          {/* Console Chrome */}
          <div className='h-12 px-5 bg-kr0n-surface-2 flex items-center justify-between gap-4 text-[13px]'>
            <div className='flex items-center gap-3 min-w-0'>
              <Kr0nMark size={16} />
              <span className='font-semibold text-white'>kr0n</span>
              <span className='text-kr0n-faint'>/</span>
              <span className='text-kr0n-text font-medium truncate'>northstar-labs</span>
              <span className='text-kr0n-faint hidden sm:inline'>/</span>
              <span className='text-kr0n-muted hidden sm:inline'>Projects</span>
            </div>
            <div className='flex items-center gap-5 text-[13px] text-kr0n-muted shrink-0'>
              <span className='hidden sm:inline tabular-nums'>3 projects</span>
              <span className='text-kr0n-accent font-medium'>
                GitHub App linked
              </span>
            </div>
          </div>

          {/* Console Interior: Split Projects Table + Audit Trail */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-[2px] bg-kr0n-canvas'>
            <div className='lg:col-span-8 bg-kr0n-black'>
              <div className='px-5 py-3 bg-kr0n-black flex items-center justify-between text-[13px] text-kr0n-muted'>
                <span>Connected repositories</span>
                <span>northstar-labs</span>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-[13px]'>
                  <thead>
                    <tr className='text-[13px] text-kr0n-muted bg-kr0n-canvas/50'>
                      <th className='px-5 py-2.5 font-normal'>Project</th>
                      <th className='px-4 py-2.5 font-normal'>Source</th>
                      <th className='px-4 py-2.5 font-normal'>Stack</th>
                      <th className='px-5 py-2.5 font-normal text-right'>Revision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHOWCASE_ROWS.map((row, idx) => (
                      <tr
                        key={row.name}
                        className={idx === 0 ? 'bg-kr0n-surface-2/60' : 'bg-kr0n-black'}
                      >
                        <td className='px-5 py-3.5'>
                          <div className='font-medium text-white'>{row.name}</div>
                          <div className='text-[13px] text-kr0n-muted mt-0.5'>
                            {row.repo}
                          </div>
                        </td>
                        <td className='px-4 py-3.5 text-[13px] text-kr0n-text-secondary'>
                          <div className='flex items-center gap-3'>
                            <span className='inline-flex items-center gap-1'>
                              <GitBranch size={12} className='text-kr0n-muted' />
                              {row.branch}
                            </span>
                            <span className='inline-flex items-center gap-1 text-kr0n-muted'>
                              <Folder size={12} />
                              {row.root}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-3.5 text-[13px] text-kr0n-text-secondary'>
                          {row.stack}
                        </td>
                        <td className='px-5 py-3.5 text-right text-[13px] tabular-nums'>
                          <div className='text-white'>{row.rev}</div>
                          <div className='text-kr0n-muted mt-0.5'>{row.updated}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='lg:col-span-4 flex flex-col justify-between bg-kr0n-black'>
              <div>
                <div className='px-5 py-3 flex items-center justify-between text-[13px] text-kr0n-muted'>
                  <span>Organization audit log</span>
                  <span>RBAC</span>
                </div>
                <div className='space-y-1 px-2 pb-3'>
                  {SHOWCASE_EVENTS.map((ev) => (
                    <div key={ev.action} className='px-3 py-2.5 rounded-[4px] bg-kr0n-canvas/60 space-y-1'>
                      <div className='flex items-center justify-between gap-2 text-[13px]'>
                        <span className='text-kr0n-text truncate'>{ev.action}</span>
                        <span className='text-kr0n-muted tabular-nums shrink-0'>
                          {ev.time}
                        </span>
                      </div>
                      <div className='text-[13px] text-kr0n-muted truncate'>
                        {ev.actor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='px-5 py-3 bg-kr0n-canvas/50 flex items-center justify-between text-[13px] text-kr0n-muted'>
                <span>3 members, 2 scoped tokens</span>
                <span className='text-kr0n-accent font-medium'>owner</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
