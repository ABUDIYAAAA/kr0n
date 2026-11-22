'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { GitBranch, Folder, ShieldCheck, Key } from 'lucide-react';

const STAGES = [
  {
    id: 'connect',
    label: 'Connect GitHub',
    headline: 'Install the GitHub App once.',
    detail:
      'Grant access to specific personal or organization repositories. No SSH deploy keys to rotate and no broad personal access tokens.',
    fragmentTitle: 'GitHub App installation',
    rows: [
      { left: 'northstar-labs', right: '4 repositories scoped' },
      { left: 'Installation', right: '#8419204, active' },
      { left: 'Authentication', right: 'Verified state handshake' },
    ],
    icon: GitBranch,
  },
  {
    id: 'monorepo',
    label: 'Map monorepos',
    headline: 'Pick any branch and root folder.',
    detail:
      'Browse repository branches and nested directories directly inside kr0n. Run web frontends, APIs, and workers from the same repository without duplicating config.',
    fragmentTitle: 'Directory discovery',
    rows: [
      { left: 'apps/web', right: 'Next.js detected' },
      { left: 'services/api', right: 'Go detected' },
      { left: 'services/worker', right: 'Python detected' },
    ],
    icon: Folder,
  },
  {
    id: 'revisions',
    label: 'Track revisions',
    headline: 'Override builds with revision safety.',
    detail:
      'Keep detected preset commands or override install, build, and output steps per project. Every update increments a revision counter and rejects stale writes.',
    fragmentTitle: 'Build revision v4',
    rows: [
      { left: 'Install command', right: 'Preset default' },
      { left: 'Build command', right: 'pnpm build (custom)' },
      { left: 'Concurrency', right: 'expected_revision: 4' },
    ],
    icon: ShieldCheck,
  },
  {
    id: 'teams',
    label: 'Govern teams',
    headline: 'Separate teams, roles, and tokens.',
    detail:
      'Isolate projects by organization, invite teammates with owner, admin, or member roles, issue scoped bearer tokens for CI, and review every administrative action in the audit log.',
    fragmentTitle: 'Access and tokens',
    rows: [
      { left: 'Nadia Okafor', right: 'owner' },
      { left: 'github-actions-ci', right: 'project:read, 30d' },
      { left: 'Audit log', right: 'Immutable event trail' },
    ],
    icon: Key,
  },
];

export default function OperationalSurface() {
  const [stageIndex, setStageIndex] = useState(0);
  const current = STAGES[stageIndex] || STAGES[0];
  const Icon = current.icon;

  return (
    <section
      id='how-it-works'
      className='bg-kr0n-black'
    >
      <div className='max-w-[1320px] mx-auto px-6 sm:px-8 py-24 sm:py-32 space-y-12'>
        {/* 50/50 Split stage display separated by flat tone steps */}
        <div className='grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-[6px]'>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className='lg:col-span-6 p-8 sm:p-12 bg-kr0n-canvas flex flex-col justify-between gap-10 min-h-[340px]'
          >
            <h2
              className='font-semibold text-white tracking-[-0.03em] leading-[1.05]'
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 3.5rem)',
                textWrap: 'balance',
              }}
            >
              {current.headline}
            </h2>
            <p className='text-base text-kr0n-text-secondary leading-relaxed max-w-[46ch]'>
              {current.detail}
            </p>
          </motion.div>

          <div className='lg:col-span-6 p-8 sm:p-12 bg-kr0n-surface-2 flex items-center justify-center'>
            <motion.div
              key={`${current.id}-ui`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              data-ui='true'
              className='w-full max-w-md bg-kr0n-black rounded-[6px] overflow-hidden'
            >
              <div className='px-4 h-11 bg-kr0n-canvas flex items-center justify-between text-[13px]'>
                <span className='inline-flex items-center gap-2 font-medium text-white'>
                  <Icon size={14} className='text-kr0n-accent' />
                  {current.fragmentTitle}
                </span>
                <span className='text-kr0n-muted tabular-nums'>
                  {stageIndex + 1} / {STAGES.length}
                </span>
              </div>
              <dl className='p-2 space-y-1 text-[13px]'>
                {current.rows.map((r) => (
                  <div
                    key={r.left}
                    className='px-3 py-3 rounded-[4px] bg-kr0n-canvas/60 flex items-center justify-between gap-4'
                  >
                    <dt className='text-kr0n-text truncate'>{r.left}</dt>
                    <dd className='text-kr0n-muted text-right shrink-0'>
                      {r.right}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>

        {/* Range slider + clickable stage stops */}
        <div className='space-y-4'>
          <label htmlFor='workflow-stage-slider' className='sr-only'>
            Select workflow stage
          </label>
          <input
            id='workflow-stage-slider'
            type='range'
            min={0}
            max={STAGES.length - 1}
            step={1}
            value={stageIndex}
            onChange={(e) => setStageIndex(Number(e.target.value))}
            className='kr0n-stage-slider'
          />

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1'>
            {STAGES.map((stage, idx) => {
              const active = idx === stageIndex;
              return (
                <button
                  key={stage.id}
                  type='button'
                  onClick={() => setStageIndex(idx)}
                  className={`text-left text-sm sm:text-base transition-colors duration-150 cursor-pointer pb-1 ${
                    active
                      ? 'text-white font-medium underline decoration-kr0n-accent underline-offset-8'
                      : 'text-kr0n-muted hover:text-kr0n-text'
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
