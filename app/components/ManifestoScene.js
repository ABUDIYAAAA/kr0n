'use client';

import { motion } from 'motion/react';
import { GitBranch, Folder, ShieldCheck } from 'lucide-react';

export default function ManifestoScene() {
  return (
    <section
      id='platform'
      className='py-28 sm:py-40 px-6 sm:px-8 bg-kr0n-black'
    >
      <div className='max-w-[1320px] mx-auto'>
        <h2 className='sr-only'>Why teams use kr0n</h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className='max-w-4xl text-white font-medium leading-[1.35] tracking-[-0.02em]'
          style={{
            fontSize: 'clamp(1.5rem, 2.35vw, 2.25rem)',
            textWrap: 'pretty',
          }}
        >
          Most cloud platforms bury a simple repository under IAM policies, deploy keys, and disconnected dashboards. In kr0n, your{' '}
          <span
            data-ui='true'
            className='inline-flex items-center gap-1.5 align-middle px-2.5 py-0.5 mx-1 bg-kr0n-surface-2 text-[0.55em] text-kr0n-text rounded-[4px] -translate-y-0.5'
          >
            <GitBranch size={13} className='text-kr0n-accent' />
            GitHub App
          </span>{' '}
          connects once, every monorepo{' '}
          <span
            data-ui='true'
            className='inline-flex items-center gap-1.5 align-middle px-2.5 py-0.5 mx-1 bg-kr0n-surface-2 text-[0.55em] text-kr0n-text rounded-[4px] -translate-y-0.5'
          >
            <Folder size={13} className='text-kr0n-accent' />
            apps/web
          </span>{' '}
          keeps its own build revision, and team{' '}
          <span
            data-ui='true'
            className='inline-flex items-center gap-1.5 align-middle px-2.5 py-0.5 mx-1 bg-kr0n-surface-2 text-[0.55em] text-kr0n-text rounded-[4px] -translate-y-0.5'
          >
            <ShieldCheck size={13} className='text-kr0n-accent' />
            RBAC &amp; audit
          </span>{' '}
          comes built in from day one.
        </motion.p>
      </div>
    </section>
  );
}
