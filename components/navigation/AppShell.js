'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Bell,
  Activity,
  CreditCard,
  Settings,
  Search,
  ChevronRight,
  Plus,
  Menu,
  X,
  Home,
  Gauge,
  HeartPulse,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { APP_NAV_ITEMS } from '@/lib/projects-data';
import CommandPalette from '@/components/navigation/CommandPalette';

const ICON_MAP = {
  home: Home,
  grid: LayoutGrid,
  bell: Bell,
  activity: Activity,
  'credit-card': CreditCard,
  settings: Settings,
  gauge: Gauge,
  'heart-pulse': HeartPulse,
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Keyboard shortcut Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = useCallback(
    (href) => {
      if (href === '/projects') {
        return pathname === '/projects' || pathname.startsWith('/projects/');
      }
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  return (
    <div className='min-h-screen bg-kr0n-canvas text-kr0n-text font-sans flex flex-col'>
      {/* ─── TOP BAR ─── */}
      <header className='sticky top-0 z-40 h-14 border-b border-kr0n-line bg-kr0n-canvas/90 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6'>
        {/* Left: Brand + context */}
        <div className='flex items-center gap-4'>
          {/* Mobile menu toggle */}
          <button
            type='button'
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className='lg:hidden p-1.5 text-kr0n-muted hover:text-white transition-colors'
            aria-label='Toggle navigation'
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link
            href='/'
            className='flex items-center gap-3 text-base font-black tracking-widest text-white hover:text-white/80 transition-colors'
          >
            <span>KR0N</span>
          </Link>

          <span className='text-kr0n-faint select-none hidden sm:inline'>/</span>

          {/* Breadcrumb context */}
          <nav className='hidden sm:flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-kr0n-muted'>
            <Link href='/projects' className='hover:text-white transition-colors'>
              Dashboard
            </Link>
            {pathname.startsWith('/projects') && pathname !== '/projects' && (
              <>
                <ChevronRight size={12} className='text-kr0n-faint' />
                <span className='text-white'>Projects</span>
              </>
            )}
          </nav>
        </div>

        {/* Right: Search + actions */}
        <div className='flex items-center gap-3'>
          {/* Search trigger */}
          <button
            type='button'
            onClick={() => setCommandPaletteOpen(true)}
            className='flex items-center gap-2.5 border border-kr0n-line bg-white/[0.02] hover:border-kr0n-line-strong hover:bg-white/[0.04] px-3 py-1.5 text-xs text-kr0n-muted hover:text-white transition-all'
            aria-label='Search projects'
          >
            <Search size={13} />
            <span className='hidden sm:inline text-[11px] font-mono'>Search</span>
            <kbd className='hidden sm:inline border border-kr0n-line bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-mono text-kr0n-faint'>
              ⌘K
            </kbd>
          </button>

          {/* New project */}
          <Link
            href='/projects'
            className='clipped-btn flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
          >
            <Plus size={13} />
            <span className='hidden sm:inline'>New</span>
          </Link>
        </div>
      </header>

      {/* ─── MAIN LAYOUT ─── */}
      <div className='flex flex-1 min-h-0'>
        {/* ─── SIDEBAR ─── */}
        {/* Desktop sidebar */}
        <aside
          className={`hidden lg:flex flex-col border-r border-kr0n-line bg-kr0n-black shrink-0 transition-[width] duration-200 ${
            sidebarCollapsed ? 'w-16' : 'w-52'
          }`}
        >
          <nav className='flex-1 py-4 px-2 space-y-1'>
            {APP_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon] || LayoutGrid;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${
                    active
                      ? 'bg-kr0n-surface text-white border-l-2 border-white'
                      : 'text-kr0n-muted hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={15} className={active ? 'text-white' : 'text-kr0n-faint'} />
                  {!sidebarCollapsed && (
                    <span className='flex-1 flex items-center justify-between'>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className='bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 leading-none'>
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                  {sidebarCollapsed && item.badge && (
                    <span className='absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-amber-400' />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className='p-3 border-t border-kr0n-line'>
            {!sidebarCollapsed && (
              <div className='text-[10px] font-mono text-kr0n-faint flex items-center justify-between'>
                <span>WORKSPACE</span>
                <span className='flex items-center gap-1.5'>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                  <span className='text-emerald-400'>ONLINE</span>
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileNavOpen && (
          <div className='lg:hidden fixed inset-0 z-30 flex'>
            <div
              className='absolute inset-0 bg-black/60 backdrop-blur-sm'
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className='relative w-64 bg-kr0n-black border-r border-kr0n-line z-10 flex flex-col'>
              <nav className='flex-1 py-4 px-2 space-y-1'>
                {APP_NAV_ITEMS.map((item) => {
                  const Icon = ICON_MAP[item.icon] || LayoutGrid;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${
                        active
                          ? 'bg-kr0n-surface text-white border-l-2 border-white'
                          : 'text-kr0n-muted hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent'
                      }`}
                    >
                      <Icon size={15} className={active ? 'text-white' : 'text-kr0n-faint'} />
                      <span className='flex-1 flex items-center justify-between'>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className='bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 leading-none'>
                            {item.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* ─── CONTENT AREA ─── */}
        <main className='flex-1 min-w-0 overflow-hidden'>{children}</main>
      </div>

      {/* ─── GLOBAL COMMAND PALETTE ─── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
