'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  Home,
  FolderGit2,
  Plus,
  BookOpen,
  Activity,
  CreditCard,
  Settings,
  Bell,
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';

export default function CommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const { projects } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  if (!isOpen) return null;

  const staticActions = [
    { id: 'dash', label: 'Overview', desc: 'Organization summary and activity', icon: Home, href: '/dashboard', category: 'Workspace' },
    { id: 'proj', label: 'Projects', desc: 'All connected repositories', icon: LayoutGrid, href: '/projects', category: 'Workspace' },
    { id: 'new', label: 'Import GitHub repository', desc: 'Connect a repo and configure build', icon: Plus, href: '/projects/new', category: 'Action' },
    { id: 'settings', label: 'Settings', desc: 'Organization, members, tokens, audit log', icon: Settings, href: '/settings', category: 'Workspace' },
    { id: 'docs', label: 'Documentation', desc: 'Guides and API reference', icon: BookOpen, href: '/docs', category: 'Docs' },
    { id: 'alerts', label: 'Alerts', desc: 'Coming soon', icon: Bell, href: '/alerts', category: 'Roadmap' },
    { id: 'usage', label: 'Usage', desc: 'Coming soon', icon: Activity, href: '/usage', category: 'Roadmap' },
    { id: 'capacity', label: 'Capacity', desc: 'Coming soon', icon: Activity, href: '/capacity', category: 'Roadmap' },
    { id: 'status', label: 'Status', desc: 'Coming soon', icon: Activity, href: '/status', category: 'Roadmap' },
    { id: 'bill', label: 'Billing', desc: 'Coming soon', icon: CreditCard, href: '/billing', category: 'Roadmap' },
  ];

  const projectActions = (projects || []).map((p) => ({
    id: `p_${p.id}`,
    label: p.name,
    desc: p.repo_full_name || p.description || 'Project configuration',
    icon: FolderGit2,
    href: `/projects/${p.id}`,
    category: 'Project',
  }));

  const allItems = [...projectActions, ...staticActions];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.desc && item.desc.toLowerCase().includes(query.toLowerCase())) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const clampedIndex = filteredItems.length > 0 ? Math.min(selectedIndex, filteredItems.length - 1) : 0;

  const handleSelect = (item) => {
    setQuery('');
    onClose();
    if (item.href) router.push(item.href);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && filteredItems.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp' && filteredItems.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems[clampedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[clampedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4 bg-black/75'
      role='dialog'
      aria-modal='true'
      aria-label='Search workspace'
      onClick={() => {
        setQuery('');
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='w-full max-w-xl rounded-[6px] bg-kr0n-black border border-kr0n-line shadow-[0_12px_28px_rgba(0,0,0,0.45)] overflow-hidden'
      >
        <div className='flex items-center gap-3 px-4 h-12 border-b border-kr0n-line bg-kr0n-canvas'>
          <Search size={15} className='text-kr0n-muted shrink-0' />
          <input
            autoFocus
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search projects, settings, or pages...'
            className='w-full bg-transparent text-sm text-kr0n-text placeholder:text-kr0n-faint outline-none'
          />
          <kbd className='px-1.5 py-0.5 rounded-[4px] border border-kr0n-line text-[11px] font-mono text-kr0n-muted bg-kr0n-black shrink-0'>
            Esc
          </kbd>
        </div>

        <div className='max-h-80 overflow-y-auto divide-y divide-kr0n-line-soft'>
          {filteredItems.length === 0 ? (
            <div className='py-10 text-center text-sm text-kr0n-muted'>
              No results matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === clampedIndex;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`relative w-full flex items-center justify-between gap-3 px-4 h-11 text-left transition-colors duration-150 cursor-pointer ${
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
                  <div className='flex items-center gap-3 min-w-0'>
                    <Icon size={14} className={isSelected ? 'text-white shrink-0' : 'text-kr0n-muted shrink-0'} />
                    <div className='min-w-0 flex items-baseline gap-2'>
                      <span className='text-[13px] font-medium truncate text-kr0n-text'>
                        {item.label}
                      </span>
                      {item.desc && (
                        <span className='text-xs text-kr0n-muted truncate hidden sm:inline'>
                          {item.desc}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className='text-xs text-kr0n-muted shrink-0'>
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className='px-4 py-2 border-t border-kr0n-line bg-kr0n-canvas flex items-center justify-between text-xs text-kr0n-muted'>
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
