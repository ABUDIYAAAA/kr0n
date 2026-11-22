'use client';

import { Search, Plus, Table2, LayoutGrid, Compass, X } from 'lucide-react';

export default function ProjectsToolbar({
  presetFilter,
  onPresetFilterChange,
  availablePresets = [],
  searchQuery,
  onSearchChange,
  projectCount,
  viewMode = 'table',
  onViewModeChange,
  onOpenNewProject,
}) {
  const presetTabs = ['all', ...availablePresets];

  return (
    <div className='border-b border-kr0n-line bg-kr0n-canvas shrink-0 z-20'>
      {/* Top title + primary action row */}
      <div className='px-6 sm:px-8 pt-7 pb-4 flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-baseline gap-3'>
          <h1 className='text-2xl font-semibold tracking-tight text-white'>
            Projects
          </h1>
          <span className='font-mono text-xs tabular-nums text-kr0n-muted'>
            {projectCount} {projectCount === 1 ? 'repository' : 'repositories'}
          </span>
        </div>

        <button
          type='button'
          onClick={onOpenNewProject}
          className='inline-flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-[13px] font-medium transition-colors duration-150 cursor-pointer'
        >
          <Plus size={14} />
          <span>Import repository</span>
        </button>
      </div>

      {/* Underline preset tabs + search + view switcher */}
      <div className='px-6 sm:px-8 flex flex-wrap items-center justify-between gap-4 border-t border-kr0n-line-soft'>
        <div className='flex items-center gap-5 overflow-x-auto no-scrollbar' role='tablist' aria-label='Filter by preset'>
          {presetTabs.map((preset) => {
            const active = presetFilter === preset;
            return (
              <button
                key={preset}
                type='button'
                role='tab'
                aria-selected={active}
                onClick={() => onPresetFilterChange?.(preset)}
                className={`h-11 text-[13px] border-b transition-colors duration-150 shrink-0 cursor-pointer ${
                  active
                    ? 'border-kr0n-accent text-white font-medium'
                    : 'border-transparent text-kr0n-muted hover:text-kr0n-text'
                }`}
              >
                {preset === 'all' ? 'All' : preset}
              </button>
            );
          })}
        </div>

        <div className='flex items-center gap-4 py-2'>
          <div className='relative'>
            <Search
              size={13}
              className='absolute left-2.5 top-1/2 -translate-y-1/2 text-kr0n-muted pointer-events-none'
            />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Filter projects...'
              className='w-48 sm:w-64 h-8 rounded-[6px] bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent pl-8 pr-7 text-xs text-kr0n-text placeholder:text-kr0n-faint outline-none transition-colors duration-150'
              aria-label='Filter projects'
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => onSearchChange('')}
                aria-label='Clear filter'
                className='absolute right-2 top-1/2 -translate-y-1/2 text-kr0n-muted hover:text-white cursor-pointer'
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* 1px accent line view mode switcher */}
          <div className='hidden md:flex items-center gap-3 text-xs'>
            {[
              { id: 'table', label: 'Table', icon: Table2 },
              { id: 'grid', label: 'Grid', icon: LayoutGrid },
              { id: 'canvas', label: 'Canvas', icon: Compass },
            ].map((mode) => {
              const Icon = mode.icon;
              const active = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type='button'
                  onClick={() => onViewModeChange?.(mode.id)}
                  className={`inline-flex items-center gap-1.5 py-1 border-b transition-colors duration-150 cursor-pointer ${
                    active
                      ? 'border-kr0n-accent text-white font-medium'
                      : 'border-transparent text-kr0n-muted hover:text-kr0n-text'
                  }`}
                >
                  <Icon size={13} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
