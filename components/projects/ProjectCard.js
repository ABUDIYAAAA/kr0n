'use client';

import { useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitBranch,
  Folder,
  Plus,
  Minus,
  Settings,
  ArrowUpRight,
} from 'lucide-react';

export default function ProjectCard({
  project,
  onDrag,
  onDragStart,
  onDragEnd,
  isDragging,
}) {
  const cardRef = useRef(null);
  const router = useRouter();
  const dragState = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, active: false });
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const el = cardRef.current;
      if (!el) return;

      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: project._x,
        origY: project._y,
        active: true,
      };

      el.setPointerCapture(e.pointerId);
      onDragStart(project.id);
    },
    [project._x, project._y, project.id, onDragStart]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragState.current.active) return;
      e.preventDefault();

      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;

      const newX = Math.max(16, Math.min(2000, dragState.current.origX + dx));
      const newY = Math.max(16, Math.min(1400, dragState.current.origY + dy));

      onDrag(project.id, newX, newY);
    },
    [project.id, onDrag]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!dragState.current.active) return;
      const dx = Math.abs(e.clientX - dragState.current.startX);
      const dy = Math.abs(e.clientY - dragState.current.startY);
      dragState.current.active = false;
      const el = cardRef.current;
      if (el) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      onDragEnd();
      if (dx < 6 && dy < 6) {
        router.push(`/projects/${project.id}`);
      }
    },
    [onDragEnd, project.id, router]
  );

  const handleKeyDown = (e) => {
    const STEP = 20;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      let newX = project._x;
      let newY = project._y;
      if (e.key === 'ArrowUp') newY = Math.max(16, newY - STEP);
      if (e.key === 'ArrowDown') newY = Math.min(1400, newY + STEP);
      if (e.key === 'ArrowLeft') newX = Math.max(16, newX - STEP);
      if (e.key === 'ArrowRight') newX = Math.min(2000, newX + STEP);
      onDrag(project.id, newX, newY);
    } else if (e.key === 'e' || e.key === 'E') {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`absolute select-none touch-none outline-none rounded-xl border transition-colors duration-150 ${
        isDragging
          ? 'z-50 cursor-grabbing border-kr0n-line-strong bg-kr0n-surface-2 shadow-2xl'
          : isExpanded
          ? 'z-30 cursor-grab border-kr0n-line-strong bg-kr0n-surface shadow-xl'
          : 'z-10 cursor-grab border-kr0n-line bg-kr0n-surface hover:border-kr0n-line-strong'
      }`}
      style={{
        left: project._x,
        top: project._y,
        width: 288,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role='article'
      aria-label={`Project ${project.name}`}
    >
      <div className='p-4 space-y-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <Link
              href={`/projects/${project.id}`}
              className='text-sm font-medium text-kr0n-text hover:underline truncate block'
            >
              {project.name}
            </Link>
            {project.repo_full_name && (
              <div className='text-xs font-mono text-kr0n-muted truncate mt-0.5'>
                {project.repo_full_name}
              </div>
            )}
          </div>

          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className='p-1 rounded-md border border-kr0n-line bg-kr0n-black text-kr0n-muted hover:text-kr0n-text transition-colors duration-150 shrink-0 cursor-pointer'
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
          </button>
        </div>

        <div className='flex items-center justify-between gap-2 text-xs font-mono'>
          <span className='px-2 py-0.5 rounded-md bg-kr0n-black border border-kr0n-line text-kr0n-text-secondary'>
            {project.application_preset || project.preset || 'auto'}
          </span>
          <span className='text-kr0n-muted inline-flex items-center gap-1 truncate'>
            <GitBranch size={11} />
            {project.production_branch || project.branch || 'main'}
          </span>
          <span className='text-kr0n-muted tabular-nums shrink-0'>
            v{project.revision || 1}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className='border-t border-kr0n-line-soft bg-kr0n-canvas-raised/80 p-4 space-y-3 rounded-b-xl'>
          {project.description && (
            <p className='text-xs text-kr0n-text-secondary leading-relaxed'>
              {project.description}
            </p>
          )}

          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div className='rounded-lg bg-kr0n-black border border-kr0n-line-soft p-2'>
              <div className='text-kr0n-muted'>Root</div>
              <div className='font-mono text-kr0n-text mt-0.5 inline-flex items-center gap-1 truncate max-w-full'>
                <Folder size={11} className='shrink-0' />
                <span className='truncate'>{project.root_directory || './'}</span>
              </div>
            </div>
            <div className='rounded-lg bg-kr0n-black border border-kr0n-line-soft p-2'>
              <div className='text-kr0n-muted'>Revision</div>
              <div className='font-mono text-kr0n-text mt-0.5 tabular-nums'>
                v{project.revision || 1}
              </div>
            </div>
          </div>

          <div className='pt-2 border-t border-kr0n-line-soft flex items-center justify-between text-xs'>
            <Link
              href={`/projects/${project.id}`}
              className='text-kr0n-text-secondary hover:text-kr0n-text inline-flex items-center gap-1 font-medium'
            >
              <span>Overview</span>
              <ArrowUpRight size={12} />
            </Link>
            <Link
              href={`/projects/${project.id}/settings`}
              className='text-kr0n-muted hover:text-kr0n-text inline-flex items-center gap-1'
            >
              <Settings size={12} />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
