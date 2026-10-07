'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutGrid,
  Home,
  Rocket,
  Plus,
  BookOpen,
  Activity,
  CreditCard,
  Settings,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PROJECTS } from '@/lib/projects-data';

export default function CommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const staticActions = [
    { id: 'dash', label: 'Go to Dashboard', icon: Home, href: '/dashboard', category: 'Navigation' },
    { id: 'proj', label: 'Open Projects Workspace', icon: LayoutGrid, href: '/projects', category: 'Navigation' },
    { id: 'logs', label: 'View Service Logs (Orvea API)', desc: 'Live stdout/stderr stream & filters', icon: Activity, href: '/projects/proj_orvea_prod/services/svc_api/logs', category: 'Observability' },
    { id: 'metrics', label: 'View Service Metrics (Orvea API)', desc: 'Latency, throughput, resources & traces', icon: Activity, href: '/projects/proj_orvea_prod/services/svc_api/metrics', category: 'Observability' },
    { id: 'usage', label: 'View Cluster Usage', icon: Activity, href: '/usage', category: 'Observability' },
    { id: 'capacity', label: 'View Resource Capacity', icon: Activity, href: '/capacity', category: 'Observability' },
    { id: 'status', label: 'System Status & History', icon: Activity, href: '/status', category: 'Observability' },
    { id: 'new', label: 'Create New Project', icon: Plus, href: '/projects', category: 'Actions' },
    { id: 'bill', label: 'Billing & Invoices', icon: CreditCard, href: '/billing', category: 'Navigation' },
    { id: 'docs', label: 'Platform Documentation', icon: BookOpen, href: '/docs', category: 'Resources' },
  ];

  const projectActions = PROJECTS.map((p) => ({
    id: `p_${p.id}`,
    label: `${p.name} (${p.environment})`,
    desc: p.description,
    icon: Rocket,
    href: `/projects/${p.id}`,
    category: 'Projects',
  }));

  const allItems = [...staticActions, ...projectActions];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.desc && item.desc.toLowerCase().includes(query.toLowerCase())) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleSelect = (item) => {
    onClose();
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md'>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        className='w-full max-w-xl bg-kr0n-surface border border-kr0n-line shadow-2xl overflow-hidden'
      >
        {/* Search Input Bar */}
        <div className='flex items-center gap-3 px-4 py-3.5 border-b border-kr0n-line bg-kr0n-canvas-raised'>
          <Search size={16} className='text-kr0n-muted shrink-0' />
          <input
            autoFocus
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type a command or search projects...'
            className='w-full bg-transparent text-sm font-mono text-white placeholder-kr0n-muted outline-none'
          />
          <kbd className='px-1.5 py-0.5 border border-kr0n-line text-[10px] font-mono text-kr0n-muted bg-kr0n-surface-2 font-medium'>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className='max-h-80 overflow-y-auto p-2 divide-y divide-kr0n-line-soft font-mono'>
          {filteredItems.length === 0 ? (
            <div className='p-6 text-center text-xs text-kr0n-muted'>
              No commands or projects match &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-kr0n-text-secondary hover:text-white'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <Icon size={14} className={isSelected ? 'text-white' : 'text-kr0n-muted'} />
                    <div className='truncate'>
                      <span className={isSelected ? 'text-white' : 'text-kr0n-text'}>{item.label}</span>
                      {item.desc && (
                        <span className='text-[10px] text-kr0n-muted ml-2 truncate hidden sm:inline'>
                          — {item.desc}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className='text-[10px] uppercase tracking-wider text-kr0n-muted shrink-0 ml-3 font-semibold'>
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className='px-4 py-2.5 border-t border-kr0n-line bg-kr0n-surface-2 flex items-center justify-between text-[10px] font-mono text-kr0n-muted'>
          <div className='flex items-center gap-3'>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className='font-bold text-white tracking-wider'>KR0N COMMAND LAYER</span>
        </div>
      </motion.div>
    </div>
  );
}
