'use client';

import { motion } from 'motion/react';

const FAQS = [
  {
    q: 'What stacks and repository layouts work?',
    a: 'Single-service repositories and monorepos both work out of the box. Browse your folder tree inside kr0n to pick any subdirectory, start from an auto-detected stack preset (Next.js, Vite, Node, Go, Python, Rust, Ruby, PHP, Java, or Dockerfile), and override install, build, or output paths whenever you need custom flags.',
  },
  {
    q: 'How is GitHub access scoped?',
    a: 'kr0n uses a GitHub App installation rather than personal access tokens or shared SSH keys. You pick the exact personal account or GitHub organization and repositories to authorize, and you can change permissions or disconnect an installation at any time from Settings.',
  },
  {
    q: 'How do teams, roles, and API tokens work?',
    a: 'Every project belongs to an organization. Owners and admins can invite teammates by email or add existing accounts directly, assign roles, issue scoped bearer tokens with explicit permission lists and expirations, and inspect every change in the audit log.',
  },
  {
    q: 'How does kr0n prevent conflicting configuration edits?',
    a: 'Every project metadata and build-settings update carries an expected revision number. If a teammate saves a change while you are editing, the control plane rejects the stale write and reloads the latest revision instead of silently overwriting work.',
  },
  {
    q: 'What is live today and what is coming next?',
    a: 'Authentication (email/password, Google, and GitHub OAuth), organizations, RBAC, invitations, scoped API tokens, audit logs, GitHub App repository/branch/directory discovery, and versioned project build settings are live today. Container build execution, live log streaming, encrypted environment variables, and CLI tooling are next on the roadmap.',
  },
];

export default function FaqSection() {
  return (
    <section
      id='faq'
      className='py-28 sm:py-36 px-6 sm:px-8 bg-kr0n-canvas'
    >
      <div className='max-w-[1320px] mx-auto space-y-16 sm:space-y-20'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          <div className='lg:col-span-6'>
            <h2
              className='font-medium text-kr0n-muted tracking-[-0.02em] leading-[1.1]'
              style={{ fontSize: 'clamp(1.625rem, 2.5vw, 2.35rem)' }}
            >
              Common questions
            </h2>
          </div>
          <div className='hidden lg:block lg:col-span-6' />
        </div>

        <div className='space-y-14 sm:space-y-20'>
          {FAQS.map((item, idx) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start'
            >
              <h3
                className='lg:col-span-6 font-medium text-white tracking-[-0.02em] leading-[1.14]'
                style={{
                  fontSize: 'clamp(1.375rem, 2.2vw, 2rem)',
                  textWrap: 'balance',
                }}
              >
                {item.q}
              </h3>
              <p className='lg:col-span-5 lg:col-start-8 text-base sm:text-[17px] text-kr0n-text-secondary leading-[1.6] max-w-[44ch]'>
                {item.a}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
