'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ArrowUpRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import DocsSearchModal from '@/components/docs/DocsSearchModal';
import Kr0nMark from '@/components/common/Kr0nMark';

export default function DocsHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const links = [
    { name: 'Overview', href: '/docs' },
    { name: 'Quick start', href: '/docs/quick-start' },
    { name: 'AI', href: '/docs/ai' },
    { name: 'CLI', href: '/docs/cli' },
    { name: 'Templates', href: '/docs/templates' },
  ];

  return (
    <>
      <header className='sticky top-0 z-40 w-full border-b border-kr0n-line bg-kr0n-canvas'>
        <div className='mx-auto flex h-13 max-w-[1240px] items-center justify-between px-6 sm:px-8'>
          <div className='flex items-center gap-6'>
            <Link
              href='/'
              className='flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white'
            >
              <Kr0nMark size={18} />
              <span className='font-mono'>kr0n</span>
              <span className='text-kr0n-faint font-normal'>/</span>
              <span className='text-sm font-medium text-kr0n-text-secondary'>Docs</span>
            </Link>

            <nav aria-label='Documentation' className='hidden md:flex items-center gap-5 text-[13px]'>
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`h-13 inline-flex items-center border-b transition-colors duration-150 ${
                      isActive
                        ? 'border-kr0n-accent text-white font-medium'
                        : 'border-transparent text-kr0n-muted hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className='flex items-center gap-2.5'>
            <button
              type='button'
              onClick={() => setSearchOpen(true)}
              className='flex items-center gap-2.5 h-8 rounded-[6px] border border-kr0n-line bg-kr0n-black hover:border-kr0n-line-strong px-2.5 text-xs text-kr0n-muted hover:text-white transition-colors duration-150 cursor-pointer'
              aria-label='Search documentation'
            >
              <Search size={13} />
              <span className='hidden sm:inline'>Search docs</span>
              <kbd className='hidden sm:inline font-mono text-[11px] text-kr0n-faint'>⌘K</kbd>
            </button>

            <Link
              href='/projects'
              className='h-8 px-3 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium transition-colors duration-150 inline-flex items-center gap-1'
            >
              <span>Console</span>
              <ArrowUpRight size={13} />
            </Link>

            <button
              type='button'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden p-1.5 text-kr0n-muted hover:text-white transition-colors duration-150'
              aria-label='Toggle docs navigation'
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className='md:hidden border-t border-kr0n-line bg-kr0n-black p-4 space-y-1 text-sm'>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 font-medium ${
                  pathname === link.href ? 'text-white' : 'text-kr0n-muted hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <DocsSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
