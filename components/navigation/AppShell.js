'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Layers,
  Rocket,
  Terminal,
  Sliders,
  LogOut,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { APP_NAV_ITEMS } from '@/lib/projects-data';
import { useKr0nStore } from '@/lib/kr0n-state';
import { getMe, logout, useAuthUser } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace-context';
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
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;
  const { projects, alerts, syncAuthUser } = useKr0nStore();
  const {
    organizations,
    activeOrg,
    setActiveOrgId,
    resetWorkspace,
  } = useWorkspace();

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (mounted && user) {
          setLiveUser(user);
          if (syncAuthUser) {
            syncAuthUser(user);
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [syncAuthUser]);

  const handleLogout = async () => {
    await logout();
    resetWorkspace();
    setLiveUser(null);
    router.push('/login');
  };

  const firingCount = alerts.filter((a) => a.status === 'firing').length;

  // Extract active project and service from URL pathname
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentUrlProjectId = projectMatch && projectMatch[1] !== 'new' ? projectMatch[1] : null;

  const [selectedProjectId, setSelectedProjectId] = useState(currentUrlProjectId || 'proj_orvea_prod');
  const [prevUrlProjectId, setPrevUrlProjectId] = useState(currentUrlProjectId);
  if (prevUrlProjectId !== currentUrlProjectId) {
    setPrevUrlProjectId(currentUrlProjectId);
    if (currentUrlProjectId) {
      setSelectedProjectId(currentUrlProjectId);
    }
  }

  // Close mobile nav on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

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
        return pathname === '/projects';
      }
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) ||
    projects[0] ||
    null;

  const serviceMatch = pathname.match(/^\/projects\/[^/]+\/services\/([^/]+)/);
  const activeServiceId = serviceMatch
    ? serviceMatch[1]
    : activeProject?.services?.[0]?.id || null;

  const projectNavItems = activeProject
    ? [
        {
          id: 'proj-overview',
          label: 'Overview',
          href: `/projects/${activeProject.id}`,
          icon: LayoutGrid,
          isActive: pathname === `/projects/${activeProject.id}`,
        },
        {
          id: 'proj-services',
          label: 'Services',
          href: `/projects/${activeProject.id}/services/${activeServiceId || 'web'}`,
          icon: Layers,
          isActive:
            pathname === `/projects/${activeProject.id}/services/${activeServiceId}` ||
            (pathname.startsWith(`/projects/${activeProject.id}/services`) &&
              !pathname.includes('/deployments') &&
              !pathname.includes('/logs') &&
              !pathname.includes('/metrics') &&
              !pathname.includes('/settings')),
        },
        {
          id: 'proj-deployments',
          label: 'Deployments',
          href: `/projects/${activeProject.id}/services/${activeServiceId || 'web'}/deployments`,
          icon: Rocket,
          isActive: pathname.includes(`/projects/${activeProject.id}/services/${activeServiceId}/deployments`),
        },
        {
          id: 'proj-logs',
          label: 'Logs',
          href: `/projects/${activeProject.id}/services/${activeServiceId || 'web'}/logs`,
          icon: Terminal,
          isActive: pathname === `/projects/${activeProject.id}/services/${activeServiceId}/logs`,
        },
        {
          id: 'proj-metrics',
          label: 'Metrics',
          href: `/projects/${activeProject.id}/services/${activeServiceId || 'web'}/metrics`,
          icon: Activity,
          isActive: pathname === `/projects/${activeProject.id}/services/${activeServiceId}/metrics`,
        },
        {
          id: 'proj-service-settings',
          label: 'Service Config',
          href: `/projects/${activeProject.id}/services/${activeServiceId || 'web'}/settings`,
          icon: Sliders,
          isActive: pathname === `/projects/${activeProject.id}/services/${activeServiceId}/settings`,
        },
        {
          id: 'proj-project-settings',
          label: 'Project Settings',
          href: `/projects/${activeProject.id}/settings`,
          icon: Settings,
          isActive: pathname === `/projects/${activeProject.id}/settings`,
        },
      ]
    : [];

  const renderNavList = () => (
    <div className='flex-1 flex flex-col min-h-0 divide-y divide-kr0n-line/40'>
      {/* ─── WORKSPACE TOP-LEVEL ITEMS ─── */}
      <div className='py-3 px-2 space-y-0.5'>
        <div className='px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-kr0n-muted font-bold'>
          Workspace
        </div>
        {APP_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutGrid;
          const active = isActive(item.href);
          const badgeValue = item.id === 'alerts' && firingCount > 0 ? firingCount : item.badge;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all font-medium ${
                active
                  ? 'bg-kr0n-surface text-white border-l-2 border-white'
                  : 'text-kr0n-text-secondary hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent'
              }`}
            >
              <Icon size={14} className={active ? 'text-white' : 'text-kr0n-muted'} />
              <span className='flex-1 flex items-center justify-between'>
                <span>{item.label}</span>
                {badgeValue && (
                  <span className='bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 leading-none'>
                    {badgeValue}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ─── SUITABLE PROJECT PAGES ─── */}
      <div className='py-3 px-2 space-y-1 flex-1 overflow-y-auto'>
        {activeProject ? (
          <>
            <div className='px-3 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-kr0n-muted font-bold'>
              <span>Project Pages</span>
              <span className='text-[9px] text-emerald-400 font-bold'>
                {activeProject.name}
              </span>
            </div>

            {/* Project Selector Chips */}
            <div className='px-2 py-1 grid grid-cols-4 gap-1'>
              {projects.map((p) => {
                const isSelected = p.id === activeProject.id;
                return (
                  <button
                    key={p.id}
                    type='button'
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`px-1 py-1 text-[9px] font-mono uppercase tracking-wider text-center transition-colors truncate border ${
                      isSelected
                        ? 'border-white bg-kr0n-surface text-white font-bold'
                        : 'border-kr0n-line bg-kr0n-black text-kr0n-text-secondary hover:text-white hover:border-kr0n-line-strong'
                    }`}
                    title={`${p.name} (${p.environment || 'production'})`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Suitable Project Nav Items */}
            <div className='space-y-0.5 pt-1'>
              {projectNavItems.map((item) => {
                const Icon = item.icon;
                const active = item.isActive;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all font-medium ${
                      active
                        ? 'bg-kr0n-surface text-white border-l-2 border-white'
                        : 'text-kr0n-text-secondary hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent'
                    }`}
                  >
                    <Icon size={13} className={active ? 'text-white' : 'text-kr0n-muted'} />
                    <span className='truncate'>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className='p-3 text-center border border-dashed border-kr0n-line/40 mx-2 my-2'>
            <p className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider'>No active project</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUserBox = () => {
    if (!currentUser) {
      return (
        <Link
          href='/login'
          className='flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] p-2 border border-kr0n-line text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-all uppercase tracking-wider font-semibold'
        >
          <span>Sign In</span>
        </Link>
      );
    }

    const userAvatar = currentUser.avatarUrl || currentUser.avatar_url || currentUser.avatar || null;
    const userDisplayName =
      currentUser.displayName ||
      currentUser.display_name ||
      currentUser.name ||
      (currentUser.email ? currentUser.email.split('@')[0] : 'User');
    const userEmail = currentUser.email || '';
    const userInitials = (userDisplayName || 'U')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className='flex items-center justify-between gap-2.5 bg-white/[0.03] hover:bg-white/[0.05] p-2 border border-kr0n-line transition-all'>
        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userDisplayName}
              className='w-7 h-7 rounded-full object-cover border border-white/10 shrink-0'
              referrerPolicy='no-referrer'
            />
          ) : (
            <div className='w-7 h-7 rounded bg-[#242930] text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 border border-white/10'>
              {userInitials}
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <div className='text-[11px] font-mono text-white truncate font-medium leading-tight'>
              {userDisplayName}
            </div>
            {userEmail && (
              <div className='text-[9px] font-mono text-kr0n-muted truncate leading-tight mt-0.5'>
                {userEmail}
              </div>
            )}
          </div>
        </div>
        <button
          type='button'
          onClick={handleLogout}
          title='Sign Out'
          className='text-kr0n-muted hover:text-red-400 p-1 transition-colors shrink-0'
        >
          <LogOut size={13} />
        </button>
      </div>
    );
  };

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

          <span className='text-kr0n-muted select-none hidden sm:inline'>/</span>

          {organizations.length > 0 && (
            <>
              <select
                value={activeOrg?.id || ''}
                onChange={(e) => setActiveOrgId(e.target.value)}
                aria-label='Active Organization'
                className='hidden sm:inline-block bg-kr0n-surface border border-kr0n-line hover:border-kr0n-line-strong text-white text-xs font-mono uppercase tracking-wider px-2.5 py-1 outline-none transition-colors'
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className='bg-kr0n-black text-white'>
                    {org.name} ({org.role_id || 'member'})
                  </option>
                ))}
              </select>
              <span className='text-kr0n-muted select-none hidden sm:inline'>/</span>
            </>
          )}

          {/* Breadcrumb context */}
          <nav className='hidden sm:flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-kr0n-text-secondary'>
            <Link href='/dashboard' className='hover:text-white transition-colors font-medium'>
              Dashboard
            </Link>
            {pathname.startsWith('/projects') && (
              <>
                <ChevronRight size={12} className='text-kr0n-muted' />
                <Link href='/projects' className='hover:text-white transition-colors font-medium'>
                  Projects
                </Link>
              </>
            )}
            {activeProject && pathname.startsWith(`/projects/${activeProject.id}`) && (
              <>
                <ChevronRight size={12} className='text-kr0n-muted' />
                <span className='text-white font-bold'>{activeProject.name}</span>
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
            className='flex items-center gap-2.5 border border-kr0n-line bg-white/[0.02] hover:border-kr0n-line-strong hover:bg-white/[0.04] px-3 py-1.5 text-xs text-kr0n-text-secondary hover:text-white transition-all font-medium'
            aria-label='Search projects'
          >
            <Search size={13} className='text-kr0n-muted' />
            <span className='hidden sm:inline text-[11px] font-mono'>Search</span>
            <kbd className='hidden sm:inline border border-kr0n-line bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-mono text-kr0n-muted font-semibold'>
              ⌘K
            </kbd>
          </button>

          {/* New project */}
          <Link
            href='/projects/new'
            className='clipped-btn flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
          >
            <Plus size={13} />
            <span className='hidden sm:inline'>New</span>
          </Link>
        </div>
      </header>

      {/* ─── MAIN LAYOUT ─── */}
      <div className='flex flex-1 min-h-0'>
        {/* ─── SIDEBAR (DESKTOP) ─── */}
        <aside className='hidden lg:flex flex-col border-r border-kr0n-line bg-kr0n-black shrink-0 w-56'>
          {renderNavList()}

          {/* Sidebar footer */}
          <div className='p-3 border-t border-kr0n-line shrink-0 space-y-2'>
            {renderUserBox()}
            <div className='text-[10px] font-mono text-kr0n-muted font-bold flex items-center justify-between tracking-wider'>
              <span>WORKSPACE</span>
              <span className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                <span className='text-emerald-400 font-bold'>ONLINE</span>
              </span>
            </div>
          </div>
        </aside>

        {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
        {mobileNavOpen && (
          <div className='lg:hidden fixed inset-0 z-30 flex'>
            <div
              className='absolute inset-0 bg-black/60 backdrop-blur-sm'
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className='relative w-64 bg-kr0n-black border-r border-kr0n-line z-10 flex flex-col justify-between'>
              {renderNavList()}
              <div className='p-3 border-t border-kr0n-line shrink-0 space-y-2'>
                {renderUserBox()}
              </div>
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
