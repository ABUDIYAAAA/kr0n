'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { GitBranch, Folder, ArrowRight } from 'lucide-react';

const REPO_EXAMPLES = [
  {
    slug: 'northstar-labs/storefront',
    branch: 'main',
    root: 'apps/web',
    stack: 'Next.js',
    install: 'pnpm install --frozen-lockfile',
    build: 'pnpm build',
    output: '.next',
  },
  {
    slug: 'meridian-pay/ledger-api',
    branch: 'main',
    root: 'cmd/server',
    stack: 'Go',
    install: 'go mod download',
    build: 'go build -o bin/server ./cmd/server',
    output: 'bin',
  },
  {
    slug: 'kestrel-io/invoice-worker',
    branch: 'release',
    root: '.',
    stack: 'Python',
    install: 'uv sync --frozen',
    build: 'uv run pytest -q',
    output: 'dist',
  },
];

function inferRepoPreview(rawInput) {
  const cleaned = rawInput
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '');

  const exact = REPO_EXAMPLES.find(
    (ex) => ex.slug.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact;

  const parts = cleaned.split('/').filter(Boolean);
  const owner = parts[0] || 'your-org';
  const repo = parts[1] || parts[0] || 'web-app';
  const root = parts.length > 2 ? parts.slice(2).join('/') : './';
  const lower = cleaned.toLowerCase();

  if (lower.includes('go') || lower.includes('api') || lower.includes('ledger')) {
    return {
      slug: `${owner}/${repo}`,
      branch: 'main',
      root,
      stack: 'Go',
      install: 'go mod download',
      build: 'go build -o bin/app .',
      output: 'bin',
    };
  }
  if (lower.includes('py') || lower.includes('worker') || lower.includes('ml')) {
    return {
      slug: `${owner}/${repo}`,
      branch: 'main',
      root,
      stack: 'Python',
      install: 'pip install -r requirements.txt',
      build: 'python -m compileall .',
      output: 'dist',
    };
  }
  if (lower.includes('rust') || lower.includes('cargo')) {
    return {
      slug: `${owner}/${repo}`,
      branch: 'main',
      root,
      stack: 'Rust',
      install: 'cargo fetch',
      build: 'cargo build --release',
      output: 'target/release',
    };
  }

  return {
    slug: `${owner}/${repo}`,
    branch: 'main',
    root,
    stack: 'Next.js',
    install: 'npm ci',
    build: 'npm run build',
    output: '.next',
  };
}

export default function RepoTypeDemo() {
  const [repoInput, setRepoInput] = useState(REPO_EXAMPLES[0].slug);
  const preview = inferRepoPreview(repoInput);

  return (
    <section className='py-28 sm:py-36 px-6 sm:px-8 bg-kr0n-canvas'>
      <div className='max-w-[1320px] mx-auto space-y-12'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
          <h2 className='text-base font-medium text-kr0n-muted'>
            Try any repository path
          </h2>
          <div className='flex flex-wrap items-center gap-6 text-sm'>
            {REPO_EXAMPLES.map((ex) => {
              const active = repoInput.trim().toLowerCase() === ex.slug.toLowerCase();
              return (
                <button
                  key={ex.slug}
                  type='button'
                  onClick={() => setRepoInput(ex.slug)}
                  className={`transition-colors duration-150 cursor-pointer ${
                    active
                      ? 'text-white underline decoration-kr0n-accent underline-offset-8 font-medium'
                      : 'text-kr0n-muted hover:text-kr0n-text'
                  }`}
                >
                  {ex.slug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Giant typeable headline input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          data-ui='true'
          className='bg-kr0n-black px-5 py-4 rounded-[6px]'
        >
          <label htmlFor='landing-repo-input' className='sr-only'>
            Enter a GitHub repository path
          </label>
          <input
            id='landing-repo-input'
            type='text'
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder='owner/repository'
            spellCheck={false}
            autoComplete='off'
            className='w-full bg-transparent text-white font-semibold tracking-[-0.035em] leading-[1.08] outline-none placeholder:text-kr0n-faint'
            style={{ fontSize: 'clamp(1.85rem, 5.8vw, 4.75rem)' }}
          />
        </motion.div>

        {/* Live parsed workspace result */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div
            data-ui='true'
            className='lg:col-span-7 bg-kr0n-black rounded-[6px] overflow-hidden'
          >
            <div className='px-5 py-3.5 bg-kr0n-surface-2 flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-3 min-w-0'>
                <span className='text-sm font-medium text-white truncate'>
                  {preview.slug}
                </span>
                <span className='text-[13px] text-kr0n-accent font-medium'>
                  {preview.stack}
                </span>
              </div>
              <div className='flex items-center gap-4 text-[13px] text-kr0n-muted'>
                <span className='inline-flex items-center gap-1'>
                  <GitBranch size={12} />
                  {preview.branch}
                </span>
                <span className='inline-flex items-center gap-1'>
                  <Folder size={12} />
                  {preview.root}
                </span>
              </div>
            </div>

            <dl className='p-2 space-y-1 text-[13px]'>
              <div className='px-3 py-2.5 rounded-[4px] bg-kr0n-canvas/60 flex items-center justify-between gap-4'>
                <dt className='text-kr0n-muted'>Install</dt>
                <dd className='text-kr0n-text truncate'><code>{preview.install}</code></dd>
              </div>
              <div className='px-3 py-2.5 rounded-[4px] bg-kr0n-canvas/60 flex items-center justify-between gap-4'>
                <dt className='text-kr0n-muted'>Build</dt>
                <dd className='text-kr0n-text truncate'><code>{preview.build}</code></dd>
              </div>
              <div className='px-3 py-2.5 rounded-[4px] bg-kr0n-canvas/60 flex items-center justify-between gap-4'>
                <dt className='text-kr0n-muted'>Output</dt>
                <dd className='text-kr0n-text-secondary truncate'><code>{preview.output}</code></dd>
              </div>
            </dl>
          </div>

          <div className='lg:col-span-5 space-y-4 lg:pt-2'>
            <p className='text-base text-kr0n-text-secondary leading-relaxed'>
              Point kr0n at a single-service repo or a nested monorepo subfolder. Defaults populate automatically, and every custom override is saved with revision concurrency so teammates never clobber each other.
            </p>
            <Link
              href='/signup'
              className='inline-flex items-center gap-2 text-sm font-medium text-white hover:text-kr0n-accent transition-colors duration-150'
            >
              <span>Import your repository in the console</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
