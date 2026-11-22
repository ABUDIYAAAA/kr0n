'use client';

import Link from 'next/link';
import {
  Search,
  Lock,
  GitBranch,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Check,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { RepoIcon } from './constants';

export default function RepoListScreen({
  activeInstallation,
  currentUser,
  accountLogin,
  showAccountMenu,
  setShowAccountMenu,
  accountMenuRef,
  connectGitHubApp,
  search,
  setSearch,
  setPage,
  fetchingRepos,
  repos,
  filteredRepos,
  paginatedRepos,
  currentPage,
  totalPages,
  startIndex,
  PAGE_SIZE,
  handleSelectRepo,
  disconnectGitHubInstallation,
}) {
  return (
    <div className='w-full max-w-5xl space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight text-white'>
            Choose a repository
          </h1>
          <p className='text-[13px] text-kr0n-muted'>
            Select a repository authorized through your GitHub App installation.
          </p>
        </div>
        <Link
          href='/projects'
          className='inline-flex items-center gap-1.5 text-xs text-kr0n-muted hover:text-white transition-colors duration-150 shrink-0'
        >
          <ArrowLeft size={14} />
          <span>Projects</span>
        </Link>
      </div>

      {/* Account selector & search bar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
        <div className='relative' ref={accountMenuRef}>
          <button
            type='button'
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className='w-full sm:w-auto h-9 flex items-center justify-between gap-2.5 bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong rounded-[6px] px-3 text-[13px] text-white shrink-0 cursor-pointer transition-colors duration-150'
          >
            <div className='flex items-center gap-2 min-w-0'>
              {activeInstallation?.avatar_url || currentUser?.avatarUrl || currentUser?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    activeInstallation?.avatar_url ||
                    currentUser?.avatarUrl ||
                    currentUser?.avatar_url
                  }
                  alt={accountLogin}
                  referrerPolicy='no-referrer'
                  className='w-4 h-4 rounded-full object-cover'
                />
              ) : (
                <div className='w-4 h-4 rounded-full bg-kr0n-surface-2 border border-kr0n-line flex items-center justify-center text-[10px] font-mono text-white'>
                  {accountLogin[0]?.toUpperCase() || 'A'}
                </div>
              )}
              <span className='font-medium truncate'>{accountLogin}</span>
            </div>
            <ChevronDown size={13} className='text-kr0n-muted shrink-0' />
          </button>

          {showAccountMenu && (
            <div className='absolute left-0 mt-1 w-64 border border-kr0n-line bg-kr0n-black rounded-[6px] shadow-[0_12px_28px_rgba(0,0,0,0.45)] py-1 z-30 text-xs'>
              <div className='px-3 py-1.5 text-kr0n-muted'>Connected account</div>
              <div className='px-3 py-1.5 flex items-center justify-between text-white font-medium'>
                <span className='truncate font-mono'>{accountLogin}</span>
                <span className='text-kr0n-healthy flex items-center gap-1'>
                  <Check size={12} /> Linked
                </span>
              </div>
              <div className='border-t border-kr0n-line-soft my-1' />
              <button
                type='button'
                onClick={() => {
                  setShowAccountMenu(false);
                  connectGitHubApp();
                }}
                className='w-full text-left px-3 py-2 text-kr0n-text-secondary hover:text-white hover:bg-kr0n-surface-2 transition-colors duration-150 flex items-center gap-2 cursor-pointer'
              >
                <GitBranch size={13} /> Manage repository access
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowAccountMenu(false);
                  connectGitHubApp();
                }}
                className='w-full text-left px-3 py-2 text-kr0n-text-secondary hover:text-white hover:bg-kr0n-surface-2 transition-colors duration-150 flex items-center gap-2 cursor-pointer'
              >
                <Plus size={13} /> Add GitHub account
              </button>
              {disconnectGitHubInstallation && (
                <button
                  type='button'
                  onClick={() => {
                    setShowAccountMenu(false);
                    disconnectGitHubInstallation();
                  }}
                  className='w-full text-left px-3 py-2 text-kr0n-error hover:bg-red-500/10 transition-colors duration-150 flex items-center gap-2 cursor-pointer border-t border-kr0n-line-soft mt-1'
                >
                  <Trash2 size={13} /> Disconnect GitHub account
                </button>
              )}
            </div>
          )}
        </div>

        <div className='flex-1 h-9 flex items-center gap-2.5 bg-kr0n-black border border-kr0n-line focus-within:border-kr0n-accent rounded-[6px] px-3 text-[13px] text-white transition-colors duration-150'>
          {fetchingRepos ? (
            <Loader2 size={14} className='text-kr0n-muted animate-spin shrink-0' />
          ) : (
            <Search size={14} className='text-kr0n-muted shrink-0' />
          )}
          <input
            type='text'
            placeholder='Search repositories...'
            aria-label='Search repositories'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='w-full bg-transparent text-[13px] outline-none text-white placeholder:text-kr0n-faint'
          />
        </div>
      </div>

      {/* Repository Table */}
      <div className='border border-kr0n-line bg-kr0n-black rounded-[6px] overflow-hidden'>
        {fetchingRepos ? (
          <div className='p-10 text-center text-[13px] text-kr0n-muted flex items-center justify-center gap-2.5'>
            <Loader2 size={15} className='animate-spin' />
            <span>Loading repositories...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className='p-10 text-center space-y-3'>
            <p className='text-sm font-medium text-white'>
              No repositories found for this installation
            </p>
            <p className='text-xs text-kr0n-muted max-w-sm mx-auto'>
              Authorize one or more repositories in GitHub to import them here.
            </p>
            <div className='pt-1'>
              <button
                type='button'
                onClick={connectGitHubApp}
                className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium transition-colors duration-150 cursor-pointer'
              >
                Configure repository permissions
              </button>
            </div>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className='p-10 text-center text-[13px] text-kr0n-muted'>
            No repositories matching &ldquo;{search}&rdquo;
          </div>
        ) : (
          <>
            <div className='divide-y divide-kr0n-line-soft'>
              {paginatedRepos.map((r) => (
                <div
                  key={r.id || r.name}
                  className='px-5 h-13 flex items-center justify-between gap-4 hover:bg-kr0n-surface-2/50 transition-colors duration-150'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <RepoIcon type={r.type} name={r.name} />
                    <div className='min-w-0 flex items-center gap-2.5'>
                      <span className='font-medium text-[13px] text-white truncate'>
                        {r.name}
                      </span>
                      {r.private && (
                        <Lock size={12} className='text-kr0n-muted shrink-0' aria-label='Private repository' />
                      )}
                      {r.default_branch && (
                        <span className='hidden sm:inline font-mono text-xs text-kr0n-muted'>
                          {r.default_branch}
                        </span>
                      )}
                      <span className='text-kr0n-faint text-xs shrink-0 hidden md:inline'>
                        · {r.updatedDate || 'Recently'}
                      </span>
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => handleSelectRepo(r)}
                    className='h-8 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black font-medium text-xs transition-colors duration-150 shrink-0 cursor-pointer'
                  >
                    Import
                  </button>
                </div>
              ))}
            </div>

            {filteredRepos.length > PAGE_SIZE && (
              <div className='px-5 py-3 bg-kr0n-canvas flex items-center justify-between border-t border-kr0n-line-soft text-xs'>
                <span className='text-kr0n-muted font-mono tabular-nums'>
                  {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredRepos.length)} of {filteredRepos.length}
                </span>

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className='h-7 px-2.5 rounded-[6px] border border-kr0n-line bg-kr0n-black text-kr0n-text-secondary hover:text-white hover:border-kr0n-line-strong disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150 flex items-center gap-1 cursor-pointer'
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </button>
                  <button
                    type='button'
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className='h-7 px-2.5 rounded-[6px] border border-kr0n-line bg-kr0n-black text-kr0n-text-secondary hover:text-white hover:border-kr0n-line-strong disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150 flex items-center gap-1 cursor-pointer'
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
