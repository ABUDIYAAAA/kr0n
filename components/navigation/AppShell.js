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
  BookOpen,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { APP_NAV_ITEMS } from '@/lib/projects-data';
import { getMe, logout, useAuthUser } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace-context';
import CommandPalette from '@/components/navigation/CommandPalette';
import Kr0nMark from '@/components/common/Kr0nMark';

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

const CORE_HREFS = new Set(['/dashboard', '/projects', '/settings']);

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;
  const {
    organizations,
    activeOrg,
    projects,
    setActiveOrgId,
    resetWorkspace,
  } = useWorkspace();

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (mounted && user) setLiveUser(user);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    resetWorkspace();
    setLiveUser(null);
    router.push('/login');
  };

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentUrlProjectId = projectMatch && projectMatch[1] !== 'new' ? projectMatch[1] : null;

  const [selectedProjectId, setSelectedProjectId] = useState(currentUrlProjectId || '');
  const [prevUrlProjectId, setPrevUrlProjectId] = useState(currentUrlProjectId);
  if (prevUrlProjectId !== currentUrlProjectId) {
    setPrevUrlProjectId(currentUrlProjectId);
    if (currentUrlProjectId) {
      setSelectedProjectId(currentUrlProjectId);
    }
  }

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

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

  const coreNavItems = APP_NAV_ITEMS.filter((item) => CORE_HREFS.has(item.href));
  const roadmapNavItems = APP_NAV_ITEMS.filter((item) => !CORE_HREFS.has(item.href));

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
          id: 'proj-settings',
          label: 'Build settings',
          href: `/projects/${activeProject.id}/settings`,
          icon: Settings,
          isActive: pathname === `/projects/${activeProject.id}/settings`,
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
          label: 'Service config',
          href: `/projects/${activeProject.id}/services/${activeServiceId || 'web'}/settings`,
          icon: Sliders,
          isActive: pathname === `/projects/${activeProject.id}/services/${activeServiceId}/settings`,
        },
      ]
    : [];

  const renderNavList = () => (
    <div className='flex-1 flex flex-col min-h-0 overflow-y-auto py-4 space-y-6'>
      {/* Core Workspace */}
      <div className='px-3 space-y-0.5'>
        <div className='px-2.5 pb-1.5 text-xs text-kr0n-muted'>
          Workspace
        </div>
        {coreNavItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutGrid;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex items-center gap-2.5 h-8 px-2.5 text-[13px] transition-colors duration-150 ${
                active
                  ? 'text-white font-medium'
                  : 'text-kr0n-muted hover:text-kr0n-text'
              }`}
            >
              {active && (
                <span
                  aria-hidden='true'
                  className='absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-kr0n-accent'
                />
              )}
              <Icon size={15} className={active ? 'text-white' : 'text-kr0n-muted'} />
              <span className='flex-1 truncate'>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Active Project Scope */}
      <div className='px-3 pt-4 border-t border-kr0n-line space-y-2'>
        <div className='px-2.5 flex items-center justify-between text-xs text-kr0n-muted'>
          <span>Project</span>
          {projects.length > 0 && (
            <span className='font-mono tabular-nums'>{projects.length}</span>
          )}
        </div>

        {activeProject ? (
          <>
            <div className='px-1'>
              <select
                value={activeProject.id}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                aria-label='Select active project'
                className='w-full h-8 rounded-[6px] border border-kr0n-line bg-kr0n-canvas px-2 text-[13px] text-kr0n-text hover:border-kr0n-line-strong outline-none transition-colors duration-150 truncate'
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className='bg-kr0n-black text-kr0n-text'>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-0.5 pt-0.5'>
              {projectNavItems.map((item) => {
                const Icon = item.icon;
                const active = item.isActive;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 h-8 px-2.5 text-[13px] transition-colors duration-150 ${
                      active
                        ? 'text-white font-medium'
                        : 'text-kr0n-muted hover:text-kr0n-text'
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden='true'
                        className='absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-kr0n-accent'
                      />
                    )}
                    <Icon size={14} className={active ? 'text-white' : 'text-kr0n-muted'} />
                    <span className='truncate'>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className='px-2.5 py-2 text-xs text-kr0n-muted space-y-1.5'>
            <p>No projects yet</p>
            <Link
              href='/projects/new'
              className='inline-flex items-center gap-1 text-kr0n-accent hover:underline font-medium'
            >
              <Plus size={12} />
              <span>Import repository</span>
            </Link>
          </div>
        )}
      </div>

      {/* Coming Soon / Roadmap routes separated quietly */}
      <div className='px-3 pt-4 border-t border-kr0n-line space-y-0.5'>
        <div className='px-2.5 pb-1.5 text-xs text-kr0n-faint'>
          Roadmap
        </div>
        {roadmapNavItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || Activity;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex items-center gap-2.5 h-8 px-2.5 text-[13px] transition-colors duration-150 ${
                active
                  ? 'text-white font-medium'
                  : 'text-kr0n-faint hover:text-kr0n-text-secondary'
              }`}
            >
              {active && (
                <span
                  aria-hidden='true'
                  className='absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-kr0n-accent'
                />
              )}
              <Icon size={14} />
              <span className='flex-1 truncate'>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Docs utility link */}
      <div className='px-3 pt-2 mt-auto'>
        <Link
          href='/docs'
          className='flex items-center gap-2.5 h-8 px-2.5 text-[13px] text-kr0n-muted hover:text-kr0n-text transition-colors duration-150'
        >
          <BookOpen size={14} />
          <span>Documentation</span>
        </Link>
      </div>
    </div>
  );

  const renderUserBox = () => {
    if (!currentUser) {
      return (
        <Link
          href='/login'
          className='flex items-center justify-center h-8 rounded-[6px] border border-kr0n-line bg-kr0n-canvas hover:border-kr0n-line-strong text-[13px] font-medium text-kr0n-text transition-colors duration-150'
        >
          Sign in
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
      <div className='flex items-center justify-between gap-2 px-1 py-0.5'>
        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userDisplayName}
              className='w-7 h-7 rounded-full object-cover border border-kr0n-line shrink-0'
              referrerPolicy='no-referrer'
            />
          ) : (
            <div className='w-7 h-7 rounded-full bg-kr0n-surface-2 text-kr0n-text flex items-center justify-center font-mono text-[11px] font-medium shrink-0 border border-kr0n-line'>
              {userInitials}
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <div className='text-[13px] font-medium text-kr0n-text truncate leading-tight'>
              {userDisplayName}
            </div>
            {userEmail && (
              <div className='text-[11px] text-kr0n-muted truncate leading-tight mt-0.5'>
                {userEmail}
              </div>
            )}
          </div>
        </div>
        <button
          type='button'
          onClick={handleLogout}
          title='Sign out'
          aria-label='Sign out'
          className='text-kr0n-muted hover:text-kr0n-error p-1.5 rounded hover:bg-kr0n-surface-2 transition-colors duration-150 shrink-0 cursor-pointer'
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-kr0n-canvas text-kr0n-text font-sans flex flex-col'>
      {/* Ruled Top Bar */}
      <header className='sticky top-0 z-40 h-13 border-b border-kr0n-line bg-kr0n-canvas flex items-center justify-between px-4 sm:px-6'>
        <div className='flex items-center gap-3 min-w-0'>
          <button
            type='button'
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className='lg:hidden p-1.5 text-kr0n-muted hover:text-kr0n-text transition-colors duration-150'
            aria-label='Toggle navigation'
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link
            href='/dashboard'
            className='flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white shrink-0'
          >
            <Kr0nMark size={18} />
            <span className='font-mono'>kr0n</span>
          </Link>

          <span className='text-kr0n-faint select-none hidden sm:inline'>/</span>

          {organizations.length > 0 && (
            <>
              <select
                value={activeOrg?.id || ''}
                onChange={(e) => setActiveOrgId(e.target.value)}
                aria-label='Active organization'
                className='hidden sm:inline-block h-8 rounded-[6px] bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong text-kr0n-text text-[13px] font-medium px-2.5 outline-none transition-colors duration-150 max-w-[200px] truncate'
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className='bg-kr0n-black text-kr0n-text'>
                    {org.name}
                  </option>
                ))}
              </select>
              <span className='text-kr0n-faint select-none hidden md:inline'>/</span>
            </>
          )}

          <nav aria-label='Breadcrumb' className='hidden md:flex items-center gap-1.5 text-[13px] text-kr0n-muted min-w-0'>
            <Link href='/dashboard' className='hover:text-kr0n-text transition-colors duration-150'>
              Overview
            </Link>
            {pathname.startsWith('/projects') && (
              <>
                <ChevronRight size={13} className='text-kr0n-faint shrink-0' />
                <Link href='/projects' className='hover:text-kr0n-text transition-colors duration-150'>
                  Projects
                </Link>
              </>
            )}
            {pathname === '/settings' && (
              <>
                <ChevronRight size={13} className='text-kr0n-faint shrink-0' />
                <span className='text-kr0n-text font-medium'>Settings</span>
              </>
            )}
            {activeProject && pathname.startsWith(`/projects/${activeProject.id}`) && (
              <>
                <ChevronRight size={13} className='text-kr0n-faint shrink-0' />
                <span className='text-kr0n-text font-medium truncate'>{activeProject.name}</span>
              </>
            )}
          </nav>
        </div>

        <div className='flex items-center gap-2.5 shrink-0'>
          <button
            type='button'
            onClick={() => setCommandPaletteOpen(true)}
            className='flex items-center gap-2.5 h-8 rounded-[6px] border border-kr0n-line bg-kr0n-black hover:border-kr0n-line-strong px-2.5 text-xs text-kr0n-muted hover:text-kr0n-text transition-colors duration-150 cursor-pointer'
            aria-label='Search workspace'
          >
            <Search size={13} />
            <span className='hidden sm:inline'>Search</span>
            <kbd className='hidden sm:inline font-mono text-[11px] text-kr0n-faint'>⌘K</kbd>
          </button>

          <Link
            href='/projects/new'
            className='inline-flex items-center gap-1.5 h-8 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black px-3 text-[13px] font-medium transition-colors duration-150'
          >
            <Plus size={14} />
            <span className='hidden sm:inline'>Import repo</span>
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className='flex flex-1 min-h-0'>
        {/* Desktop Sidebar */}
        <aside className='hidden lg:flex flex-col border-r border-kr0n-line bg-kr0n-black shrink-0 w-56'>
          {renderNavList()}
          <div className='p-3 border-t border-kr0n-line shrink-0'>
            {renderUserBox()}
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileNavOpen && (
          <div className='lg:hidden fixed inset-0 z-30 flex'>
            <div
              className='absolute inset-0 bg-black/75'
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className='relative w-64 bg-kr0n-black border-r border-kr0n-line z-10 flex flex-col justify-between pt-13'>
              {renderNavList()}
              <div className='p-3 border-t border-kr0n-line shrink-0'>
                {renderUserBox()}
              </div>
            </aside>
          </div>
        )}

        {/* Content Area */}
        <main className='flex-1 min-w-0'>{children}</main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
