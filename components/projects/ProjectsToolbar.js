'use client';

import { Search, Plus, LayoutGrid, Compass, X } from 'lucide-react';

export default function ProjectsToolbar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  projectCount,
  viewMode = 'canvas',
  onViewModeChange,
  onOpenNewProject,
}) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'production', label: 'Prod' },
    { id: 'staging', label: 'Stage' },
    { id: 'attention', label: 'Attention' },
  ];

  return (
    <div className='h-14 border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-20'>
      {/* Left: Title + count + View Mode */}
      <div className='flex items-center gap-4 sm:gap-6'>
        <div className='flex items-center gap-2.5'>
          <h1 className='text-xs font-mono font-bold text-white uppercase tracking-widest'>
            Projects
          </h1>
          <span className='px-1.5 py-0.5 border border-kr0n-line text-[10px] font-mono text-kr0n-faint'>
            {projectCount}
          </span>
        </div>

        {/* View Mode Toggle: Canvas vs Grid */}
        <div className='hidden md:flex items-center border border-kr0n-line bg-kr0n-black/60 p-0.5 text-[11px] font-mono'>
          <button
            type='button'
            onClick={() => onViewModeChange && onViewModeChange('canvas')}
            className={`flex items-center gap-1.5 px-2.5 py-1 uppercase tracking-wider transition-all ${
              viewMode === 'canvas'
                ? 'bg-kr0n-surface text-white font-bold border-b border-white'
                : 'text-kr0n-muted hover:text-white'
            }`}
            title='Spatial interactive canvas'
          >
            <Compass size={12} />
            <span>Spatial Canvas</span>
          </button>
          <button
            type='button'
            onClick={() => onViewModeChange && onViewModeChange('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 uppercase tracking-wider transition-all ${
              viewMode === 'grid'
                ? 'bg-kr0n-surface text-white font-bold border-b border-white'
                : 'text-kr0n-muted hover:text-white'
            }`}
            title='Structured grid view'
          >
            <LayoutGrid size={12} />
            <span>List Grid</span>
          </button>
        </div>
      </div>

      {/* Center: Filters */}
      <div className='hidden lg:flex items-center gap-1 bg-kr0n-black/50 border border-kr0n-line-soft p-0.5'>
        {filters.map((f) => (
          <button
            key={f.id}
            type='button'
            onClick={() => onFilterChange(f.id)}
            className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-all ${
              filter === f.id
                ? 'bg-kr0n-surface text-white border-b border-white font-bold'
                : 'text-kr0n-muted hover:text-white'
            }`}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Right: Search + New Project CTA */}
      <div className='flex items-center gap-3'>
        <div className='relative'>
          <Search
            size={12}
            className='absolute left-2.5 top-1/2 -translate-y-1/2 text-kr0n-faint pointer-events-none'
          />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Filter objects...'
            className='w-36 sm:w-48 bg-kr0n-black/60 border border-kr0n-line hover:border-kr0n-line-strong focus:border-white pl-8 pr-7 py-1.5 text-[11px] font-mono text-white placeholder-kr0n-faint outline-none transition-colors'
            aria-label='Filter projects'
          />
          {searchQuery && (
            <button
              type='button'
              onClick={() => onSearchChange('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-kr0n-faint hover:text-white'
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* New Project Button */}
        <button
          type='button'
          onClick={onOpenNewProject}
          className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
        >
          <Plus size={13} />
          <span className='hidden sm:inline'>New Project</span>
        </button>
      </div>
    </div>
  );
}
