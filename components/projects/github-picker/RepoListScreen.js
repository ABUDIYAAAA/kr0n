'use client';

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
}) {
  return (
    <div className="w-full max-w-3xl space-y-5">
      {/* Header Title */}
      <h1 className="text-2xl font-bold tracking-tight text-white">Import Git Repository</h1>

      {/* Account Selector & Search Bar Row */}
      <div className="flex items-center gap-3">
        {/* Account Selector Pill */}
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 bg-[#0c0c0c] border border-[#222222] hover:border-[#333333] rounded-md px-3 py-2 text-sm text-neutral-200 shrink-0 cursor-pointer transition-colors"
          >
            {activeInstallation?.avatar_url || currentUser?.avatarUrl || currentUser?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  activeInstallation?.avatar_url ||
                  currentUser?.avatarUrl ||
                  currentUser?.avatar_url
                }
                alt={accountLogin}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                {accountLogin[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <span className="font-medium text-sm text-white">{accountLogin}</span>
            <ChevronDown size={14} className="text-neutral-400 ml-1" />
          </button>

          {showAccountMenu && (
            <div className="absolute left-0 mt-1.5 w-64 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 text-xs">
              <div className="px-3 py-1.5 text-neutral-400 font-mono text-[10px] uppercase">
                Connected Account
              </div>
              <div className="px-3 py-1.5 flex items-center justify-between text-white font-medium">
                <span className="truncate">{accountLogin}</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Check size={11} /> Connected
                </span>
              </div>
              <div className="border-t border-[#1c1c1c] my-1" />
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  connectGitHubApp();
                }}
                className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <GitBranch size={13} /> Manage Repository Permissions
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  connectGitHubApp();
                }}
                className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus size={13} /> Add Another GitHub Account
              </button>
            </div>
          )}
        </div>

        {/* Search Input Box */}
        <div className="flex-1 flex items-center gap-2.5 bg-[#0c0c0c] border border-[#222222] focus-within:border-[#444444] rounded-md px-3.5 py-2 text-sm text-white transition-colors">
          {fetchingRepos ? (
            <Loader2 size={15} className="text-neutral-400 animate-spin shrink-0" />
          ) : (
            <Search size={15} className="text-neutral-500 shrink-0" />
          )}
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Repository List Box */}
      <div className="border border-[#222222] bg-[#0c0c0c] rounded-lg divide-y divide-[#1c1c1c] overflow-hidden">
        {fetchingRepos ? (
          <div className="divide-y divide-[#181818]">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="px-4 py-3.5 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-neutral-800" />
                  <div className="h-4 w-36 sm:w-48 bg-neutral-800 rounded" />
                  <div className="h-3 w-16 bg-neutral-900 rounded hidden sm:block" />
                </div>
                <div className="h-7 w-16 bg-neutral-800/80 rounded-md" />
              </div>
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-neutral-400">
              No repositories found for this account.
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Ensure you authorized KR0N to access your repositories on GitHub.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={connectGitHubApp}
                className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Configure Repository Permissions
              </button>
            </div>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No repositories found matching &ldquo;{search}&rdquo;
          </div>
        ) : (
          <>
            {paginatedRepos.map((r) => (
              <div
                key={r.id || r.name}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                {/* Left: Icon + Name + Lock + Date */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <RepoIcon type={r.type} name={r.name} />
                  <span className="font-medium text-sm text-white truncate">{r.name}</span>
                  {r.private && <Lock size={12} className="text-neutral-400 shrink-0 ml-0.5" />}
                  <span className="text-neutral-400 text-sm shrink-0">
                    · {r.updatedDate || 'Recently'}
                  </span>
                </div>

                {/* Right: White Import Button */}
                <button
                  onClick={() => handleSelectRepo(r)}
                  className="bg-white text-black font-semibold text-sm px-5 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
                >
                  Import
                </button>
              </div>
            ))}

            {/* Pagination Footer */}
            {filteredRepos.length > PAGE_SIZE && (
              <div className="px-4 py-3 bg-[#0c0c0c] flex items-center justify-between border-t border-[#1c1c1c] text-xs">
                <span className="text-neutral-400 font-mono text-[11px]">
                  Showing <span className="text-white font-medium">{startIndex + 1}</span>–
                  <span className="text-white font-medium">
                    {Math.min(startIndex + PAGE_SIZE, filteredRepos.length)}
                  </span>{' '}
                  of <span className="text-white font-medium">{filteredRepos.length}</span> repositories
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-[#222222] bg-[#121212] text-neutral-300 hover:text-white hover:border-[#333333] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </button>

                  {/* Page number indicators */}
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) {
                          acc.push('ellipsis-' + p);
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item) => {
                        if (typeof item === 'string') {
                          return (
                            <span key={item} className="px-1 text-neutral-600 font-mono">
                              …
                            </span>
                          );
                        }
                        const isCurrent = item === currentPage;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`w-7 h-7 rounded text-xs font-mono transition-colors cursor-pointer flex items-center justify-center ${
                              isCurrent
                                ? 'bg-white text-black font-semibold'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#222222]'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-[#222222] bg-[#121212] text-neutral-300 hover:text-white hover:border-[#333333] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer font-medium"
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
