'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, FileText } from 'lucide-react';
import { SEARCH_INDEX } from '@/lib/docs-data';

export default function DocsSearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = query.trim()
    ? SEARCH_INDEX.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : SEARCH_INDEX.slice(0, 6);

  const clampedIndex = filtered.length > 0 ? Math.min(selectedIndex, filtered.length - 1) : 0;

  const handleSelect = (slug) => {
    setQuery('');
    onClose();
    router.push(slug);
  };

  const handleKeyNavigation = (e) => {
    if (e.key === 'ArrowDown' && filtered.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp' && filtered.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered[clampedIndex]) {
      e.preventDefault();
      handleSelect(filtered[clampedIndex].slug);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Search documentation'
      onClick={onClose}
      className='fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-sm'
    >
      <div
        className='w-full max-w-xl rounded-xl border border-kr0n-line bg-kr0n-surface shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center px-4 h-13 border-b border-kr0n-line bg-kr0n-canvas-raised gap-3'>
          <Search size={16} className='text-kr0n-muted shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyNavigation}
            placeholder='Search documentation...'
            className='w-full bg-transparent text-sm text-kr0n-text placeholder:text-kr0n-faint outline-none'
          />
          {query ? (
            <button
              type='button'
              onClick={() => setQuery('')}
              aria-label='Clear search'
              className='text-kr0n-muted hover:text-kr0n-text p-1 cursor-pointer'
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className='hidden sm:inline-block rounded-md border border-kr0n-line bg-kr0n-black px-1.5 py-0.5 text-[11px] font-mono text-kr0n-muted'>
              Esc
            </kbd>
          )}
        </div>

        <div className='max-h-[60vh] overflow-y-auto p-2 space-y-0.5'>
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === clampedIndex;
              return (
                <button
                  key={item.slug}
                  type='button'
                  onClick={() => handleSelect(item.slug)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-4 transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-kr0n-surface-2 text-kr0n-text'
                      : 'text-kr0n-text-secondary hover:bg-kr0n-surface-2/60'
                  }`}
                >
                  <div className='space-y-0.5 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-[11px] font-mono text-kr0n-muted'>
                        {item.section}
                      </span>
                      <span className='text-sm font-medium text-kr0n-text truncate'>
                        {item.title}
                      </span>
                    </div>
                    <p className='text-xs text-kr0n-muted line-clamp-1'>
                      {item.snippet}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className={isSelected ? 'text-kr0n-text shrink-0' : 'text-kr0n-faint shrink-0'}
                  />
                </button>
              );
            })
          ) : (
            <div className='py-12 text-center text-kr0n-muted text-sm space-y-2'>
              <FileText size={20} className='mx-auto text-kr0n-faint' />
              <p>No documentation matches &ldquo;{query}&rdquo;.</p>
            </div>
          )}
        </div>

        <div className='px-4 py-2.5 bg-kr0n-canvas-raised border-t border-kr0n-line flex items-center justify-between text-xs text-kr0n-muted'>
          <div className='flex items-center gap-4'>
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
          </div>
          <span className='font-mono'>kr0n docs</span>
        </div>
      </div>
    </div>
  );
}
