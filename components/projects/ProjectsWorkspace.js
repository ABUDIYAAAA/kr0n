'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, GitBranch, Folder, Settings, ArrowUpRight } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ProjectsToolbar from './ProjectsToolbar';
import { useWorkspace } from '@/lib/workspace-context';

function formatShortDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectsWorkspace() {
  const router = useRouter();
  const { projects: storeProjects, isLoadingProjects } = useWorkspace();

  const [projects, setProjects] = useState(() =>
    (storeProjects || []).map((p, idx) => ({
      ...p,
      _x: p._x || p.position?.x || 48 + (idx % 3) * 320,
      _y: p._y || p.position?.y || 48 + Math.floor(idx / 3) * 200,
    }))
  );

  const [prevStoreProjects, setPrevStoreProjects] = useState(storeProjects);
  if (storeProjects !== prevStoreProjects) {
    setPrevStoreProjects(storeProjects);
    setProjects(
      (storeProjects || []).map((p, idx) => ({
        ...p,
        _x: p._x || p.position?.x || 48 + (idx % 3) * 320,
        _y: p._y || p.position?.y || 48 + Math.floor(idx / 3) * 200,
      }))
    );
  }

  const [presetFilter, setPresetFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const canvasRef = useRef(null);

  const availablePresets = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => {
      const preset = p.application_preset || p.preset;
      if (preset) set.add(preset);
    });
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = projects.filter((p) => {
    const preset = p.application_preset || p.preset || 'auto';
    if (presetFilter !== 'all' && preset !== presetFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.repo_full_name || '').toLowerCase().includes(q) ||
        preset.toLowerCase().includes(q) ||
        (p.production_branch || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDrag = useCallback((id, x, y) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, _x: x, _y: y } : p))
    );
  }, []);

  const handleDragStart = useCallback((id) => setDraggingId(id), []);
  const handleDragEnd = useCallback(() => setDraggingId(null), []);

  return (
    <div className='flex flex-col h-full bg-kr0n-canvas relative'>
      <ProjectsToolbar
        presetFilter={presetFilter}
        onPresetFilterChange={setPresetFilter}
        availablePresets={availablePresets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projectCount={filteredProjects.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewProject={() => router.push('/projects/new')}
      />

      {isLoadingProjects ? (
        <div className='flex-1 flex items-center justify-center p-12 text-sm text-kr0n-muted'>
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className='flex-1 flex items-center justify-center p-10'>
          <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black p-10 text-center space-y-4 max-w-md w-full'>
            <div className='space-y-1.5'>
              <h2 className='text-sm font-semibold text-white'>
                {searchQuery || presetFilter !== 'all'
                  ? 'No matching projects'
                  : 'No projects yet'}
              </h2>
              <p className='text-[13px] text-kr0n-muted leading-relaxed'>
                {searchQuery || presetFilter !== 'all'
                  ? 'Clear your search query or preset tab to view all repositories.'
                  : 'Import a GitHub repository to configure your first project in this organization.'}
              </p>
            </div>
            <div className='flex items-center justify-center gap-2.5'>
              {(searchQuery || presetFilter !== 'all') && (
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('');
                    setPresetFilter('all');
                  }}
                  className='h-9 px-3.5 rounded-[6px] border border-kr0n-line text-xs font-medium text-kr0n-text hover:border-kr0n-line-strong transition-colors duration-150 cursor-pointer'
                >
                  Clear filters
                </button>
              )}
              <button
                type='button'
                onClick={() => router.push('/projects/new')}
                className='inline-flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium transition-colors duration-150 cursor-pointer'
              >
                <Plus size={14} />
                <span>Import repository</span>
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className='flex-1 overflow-auto px-6 sm:px-8 py-6'>
          <div className='max-w-[1240px] rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-x-auto'>
            <table className='w-full text-left text-[13px]'>
              <thead>
                <tr className='border-b border-kr0n-line text-xs text-kr0n-muted'>
                  <th className='px-5 py-3 font-normal'>Project</th>
                  <th className='px-4 py-3 font-normal'>Branch</th>
                  <th className='px-4 py-3 font-normal'>Root directory</th>
                  <th className='px-4 py-3 font-normal'>Preset</th>
                  <th className='px-4 py-3 font-normal text-right'>Revision</th>
                  <th className='px-4 py-3 font-normal text-right'>Updated</th>
                  <th className='px-5 py-3 font-normal text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-kr0n-line-soft'>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className='hover:bg-kr0n-surface-2/50 transition-colors duration-150'
                  >
                    <td className='px-5 py-3.5'>
                      <Link
                        href={`/projects/${project.id}`}
                        className='font-medium text-white hover:text-kr0n-accent transition-colors duration-150 block truncate max-w-[260px]'
                      >
                        {project.name}
                      </Link>
                      <div className='font-mono text-xs text-kr0n-muted truncate max-w-[260px]'>
                        {project.repo_full_name || project.slug}
                      </div>
                    </td>
                    <td className='px-4 py-3.5 font-mono text-xs text-kr0n-text-secondary'>
                      <span className='inline-flex items-center gap-1.5'>
                        <GitBranch size={12} className='text-kr0n-muted' />
                        {project.production_branch || 'main'}
                      </span>
                    </td>
                    <td className='px-4 py-3.5 font-mono text-xs text-kr0n-muted'>
                      <span className='inline-flex items-center gap-1.5'>
                        <Folder size={12} />
                        {project.root_directory || './'}
                      </span>
                    </td>
                    <td className='px-4 py-3.5 font-mono text-xs text-kr0n-text-secondary'>
                      {project.application_preset || 'auto'}
                    </td>
                    <td className='px-4 py-3.5 text-right font-mono text-xs tabular-nums text-white'>
                      v{project.revision || 1}
                    </td>
                    <td className='px-4 py-3.5 text-right font-mono text-xs tabular-nums text-kr0n-muted'>
                      {formatShortDate(project.updated_at || project.created_at)}
                    </td>
                    <td className='px-5 py-3.5 text-right'>
                      <div className='inline-flex items-center justify-end gap-3 text-xs'>
                        <Link
                          href={`/projects/${project.id}`}
                          className='text-kr0n-text-secondary hover:text-white transition-colors duration-150'
                        >
                          Open
                        </Link>
                        <Link
                          href={`/projects/${project.id}/settings`}
                          className='text-kr0n-muted hover:text-white transition-colors duration-150'
                        >
                          Settings
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className='flex-1 overflow-auto px-6 sm:px-8 py-6'>
          <div className='max-w-[1240px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className='rounded-[6px] border border-kr0n-line bg-kr0n-black hover:border-kr0n-line-strong transition-colors duration-150 flex flex-col justify-between overflow-hidden'
              >
                <Link href={`/projects/${project.id}`} className='p-5 space-y-3 flex-1 block'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <h2 className='text-[15px] font-medium text-white truncate'>
                        {project.name}
                      </h2>
                      <p className='text-xs font-mono text-kr0n-muted truncate mt-0.5'>
                        {project.repo_full_name || project.slug}
                      </p>
                    </div>
                    <span className='font-mono text-xs tabular-nums text-kr0n-muted shrink-0'>
                      v{project.revision || 1}
                    </span>
                  </div>

                  {project.description && (
                    <p className='text-xs text-kr0n-text-secondary line-clamp-2 leading-relaxed'>
                      {project.description}
                    </p>
                  )}

                  <div className='flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-kr0n-muted'>
                    <span className='text-kr0n-text-secondary'>
                      {project.application_preset || 'auto'}
                    </span>
                    <span className='inline-flex items-center gap-1'>
                      <GitBranch size={12} />
                      {project.production_branch || 'main'}
                    </span>
                    <span className='inline-flex items-center gap-1'>
                      <Folder size={12} />
                      {project.root_directory || './'}
                    </span>
                  </div>
                </Link>

                <div className='px-5 py-2.5 border-t border-kr0n-line-soft flex items-center justify-between text-xs'>
                  <Link
                    href={`/projects/${project.id}`}
                    className='text-kr0n-text-secondary hover:text-white inline-flex items-center gap-1 transition-colors duration-150'
                  >
                    <span>Overview</span>
                    <ArrowUpRight size={12} />
                  </Link>
                  <Link
                    href={`/projects/${project.id}/settings`}
                    className='text-kr0n-muted hover:text-white inline-flex items-center gap-1 transition-colors duration-150'
                  >
                    <Settings size={12} />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={canvasRef} className='flex-1 relative overflow-auto kr0n-grid-bg select-none'>
          <div className='absolute bottom-4 left-6 z-20 pointer-events-none hidden sm:flex items-center gap-3 text-xs text-kr0n-muted bg-kr0n-black border border-kr0n-line rounded-[6px] px-3 py-1.5'>
            <span>Drag cards to arrange</span>
            <span>·</span>
            <span>Arrow keys when focused</span>
          </div>

          <div className='relative' style={{ minWidth: 1400, minHeight: 900, zIndex: 2 }}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onDrag={handleDrag}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggingId === project.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
