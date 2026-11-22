'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

const COMMANDS = [
  {
    id: 'signup',
    category: 'Account',
    label: 'Create an account',
    detail: 'Start connecting GitHub repositories and teams',
    action: (router) => router.push('/signup'),
  },
  {
    id: 'login',
    category: 'Account',
    label: 'Sign in to console',
    detail: 'Open your organization dashboard',
    action: (router) => router.push('/login'),
  },
  {
    id: 'import-repo',
    category: 'Console',
    label: 'Import a GitHub repository',
    detail: 'Connect the GitHub App and configure a project',
    action: (router) => router.push('/projects/new'),
  },
  {
    id: 'workflow',
    category: 'Page',
    label: 'Inspect workflow stages',
    detail: 'Walk through GitHub connect, monorepos, revisions, and RBAC',
    action: () => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    id: 'faq',
    category: 'Page',
    label: 'Read common questions',
    detail: 'Supported stacks, GitHub App scope, and current capabilities',
    action: () => {
      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    id: 'docs-quickstart',
    category: 'Docs',
    label: 'Quick start guide',
    detail: 'Step-by-step setup guide',
    action: (router) => router.push('/docs/quick-start'),
  },
  {
    id: 'docs-home',
    category: 'Docs',
    label: 'Documentation index',
    detail: 'Browse current control plane documentation',
    action: (router) => router.push('/docs'),
  },
];

export default function CommandLayer({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.detail.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const clampedIndex =
    filteredCommands.length > 0 && selectedIndex < filteredCommands.length
      ? selectedIndex
      : 0;

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown' && filteredCommands.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp' && filteredCommands.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[clampedIndex];
        if (selected) {
          selected.action?.(router);
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clampedIndex, filteredCommands, handleClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75'
      role='dialog'
      aria-modal='true'
      aria-label='Command menu'
      onClick={handleClose}
    >
      <div
        className='w-full max-w-xl rounded-[6px] border border-kr0n-line bg-kr0n-black shadow-[0_12px_28px_rgba(0,0,0,0.45)] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center px-4 h-12 border-b border-kr0n-line bg-kr0n-canvas gap-3'>
          <Search size={15} className='text-kr0n-muted shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder='Jump to a page, guide, or action...'
            className='w-full bg-transparent text-sm text-kr0n-text placeholder:text-kr0n-faint outline-none'
          />
          <button
            type='button'
            onClick={handleClose}
            className='px-1.5 py-0.5 rounded-[4px] border border-kr0n-line bg-kr0n-black text-[11px] font-mono text-kr0n-muted hover:text-kr0n-text transition-colors duration-150 cursor-pointer shrink-0'
            aria-label='Close command menu'
          >
            Esc
          </button>
        </div>

        <div className='max-h-80 overflow-y-auto divide-y divide-kr0n-line-soft' role='listbox'>
          {filteredCommands.length === 0 ? (
            <div className='py-10 text-center text-sm text-kr0n-muted'>
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === clampedIndex;
              return (
                <button
                  key={cmd.id}
                  type='button'
                  role='option'
                  aria-selected={isSelected}
                  onClick={() => {
                    cmd.action?.(router);
                    handleClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`relative w-full text-left px-4 py-3 transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-kr0n-surface-2 text-white'
                      : 'text-kr0n-text-secondary hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <span
                      aria-hidden='true'
                      className='absolute left-0 top-0 bottom-0 w-[2px] bg-kr0n-accent'
                    />
                  )}
                  <div className='min-w-0'>
                    <div className='text-[13px] font-medium text-kr0n-text truncate'>
                      {cmd.label}
                    </div>
                    <div className='text-xs text-kr0n-muted truncate mt-0.5'>
                      {cmd.detail}
                    </div>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='text-xs text-kr0n-muted'>{cmd.category}</span>
                    {isSelected && <ArrowRight size={13} className='text-kr0n-accent' />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className='px-4 py-2 bg-kr0n-canvas border-t border-kr0n-line flex items-center justify-between text-xs text-kr0n-muted'>
          <div className='flex items-center gap-4'>
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
          </div>
          <span className='font-mono'>kr0n</span>
        </div>
      </div>
    </div>
  );
}
