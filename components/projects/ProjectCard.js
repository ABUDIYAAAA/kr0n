'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  MoreHorizontal,
  ExternalLink,
  Rocket,
  GitBranch,
  Cpu,
  HardDrive,
  Plus,
  Minus,
  Layers,
  ChevronDown,
  Terminal,
  Share2,
} from 'lucide-react';
import { STATUS_CONFIG, DEPLOYMENT_STATUS_CONFIG } from '@/lib/projects-data';
import ProjectEndpoint from './ProjectEndpoint';

export default function ProjectCard({
  project,
  index,
  onDrag,
  onDragStart,
  onDragEnd,
  isDragging,
  onDeploy,
  onHeightChange,
}) {
  const cardRef = useRef(null);
  const dragState = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, active: false });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.healthy;
  const deployStatus =
    DEPLOYMENT_STATUS_CONFIG[project.currentDeployment.status] ||
    DEPLOYMENT_STATUS_CONFIG.live;
  const isDeploying = project.currentDeployment.status === 'deploying';

  // Measure height changes to notify connector layer
  useEffect(() => {
    if (cardRef.current && onHeightChange) {
      onHeightChange(project.id, cardRef.current.offsetHeight);
    }
  }, [isExpanded, onHeightChange, project.id]);

  const handlePointerDown = useCallback(
    (e) => {
      // Never trigger drag on interactive elements
      if (
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('input') ||
        e.target.closest('.group\\/endpoint')
      ) {
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

      let newX = dragState.current.origX + dx;
      let newY = dragState.current.origY + dy;

      // Restrict within usable workspace
      newX = Math.max(10, Math.min(2400, newX));
      newY = Math.max(10, Math.min(1800, newY));

      onDrag(project.id, newX, newY);
    },
    [project.id, onDrag]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!dragState.current.active) return;
      dragState.current.active = false;
      const el = cardRef.current;
      if (el) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      onDragEnd();
    },
    [onDragEnd]
  );

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const STEP = 20;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      let newX = project._x;
      let newY = project._y;
      if (e.key === 'ArrowUp') newY = Math.max(10, newY - STEP);
      if (e.key === 'ArrowDown') newY = Math.min(1800, newY + STEP);
      if (e.key === 'ArrowLeft') newX = Math.max(10, newX - STEP);
      if (e.key === 'ArrowRight') newX = Math.min(2400, newX + STEP);
      onDrag(project.id, newX, newY);
    } else if (e.key === 'e' || e.key === 'E') {
      setIsExpanded((prev) => !prev);
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <motion.div
      ref={cardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: isDragging
          ? '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.2)'
          : isHovered
          ? '0 12px 28px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
          : '0 2px 8px rgba(0,0,0,0.35)',
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        opacity: { duration: 0.3, delay: index * 0.04 },
        scale: { duration: 0.3, delay: index * 0.04 },
        y: { duration: 0.3, delay: index * 0.04 },
        boxShadow: { duration: 0.15 },
      }}
      className={`absolute select-none touch-none outline-none group ${
        isDragging
          ? 'z-50 cursor-grabbing'
          : isExpanded
          ? 'z-30 cursor-grab'
          : 'z-10 cursor-grab focus-visible:ring-1 focus-visible:ring-white/40'
      }`}
      style={{
        left: project._x,
        top: project._y,
        width: 268,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
      role='article'
      aria-label={`Project: ${project.name} (${project.environment}) — Press E to toggle inspection`}
    >
      <div
        className={`bg-kr0n-surface border transition-colors duration-150 relative ${
          isDragging
            ? 'border-white/25 bg-kr0n-surface-2'
            : isHovered || isExpanded
            ? 'border-kr0n-line-strong bg-kr0n-surface'
            : 'border-kr0n-line bg-kr0n-canvas-raised'
        }`}
      >
        {/* Linked project subtle rail header */}
        {project.linkedTo && (
          <div className='px-3 py-1 bg-kr0n-black/75 border-b border-kr0n-line-soft flex items-center justify-between text-[8px] font-mono tracking-widest text-kr0n-faint'>
            <span className='flex items-center gap-1'>
              <Share2 size={9} />
              <span>{project.group || 'LINKED'}</span>
            </span>
            <span className='text-kr0n-muted font-bold'>
              {project.environment === 'production' ? 'PROD' : 'STAGE'}
            </span>
          </div>
        )}

        {/* ─── PRIMARY COMPACT CARD HEADER ─── */}
        <div className='p-3.5 space-y-2.5'>
          {/* Identity & Status */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 min-w-0'>
              {/* Technical Index */}
              <span className='text-[10px] font-mono text-kr0n-faint font-semibold shrink-0'>
                {project.index || '01'}
              </span>

              {/* Status Glyph */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${status.dotClass} ${
                  project.status === 'healthy' || isDeploying ? 'animate-pulse' : ''
                }`}
                aria-label={`Status: ${status.label}`}
              />

              {/* Project Name */}
              <span className='text-xs font-mono font-bold text-white uppercase tracking-wider truncate'>
                {project.name}
              </span>
            </div>

            {/* Right Controls: Expand & Options */}
            <div className='flex items-center gap-1 shrink-0'>
              {/* Expand Affordance Button */}
              <button
                type='button'
                onClick={toggleExpand}
                className='p-1 border border-kr0n-line-soft hover:border-kr0n-line text-kr0n-muted hover:text-white bg-kr0n-black/40 transition-colors'
                title={isExpanded ? 'Collapse inspection' : 'Expand inspection'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <Minus size={11} /> : <Plus size={11} />}
              </button>

              {/* Options */}
              <div className='relative'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className='p-1 text-kr0n-faint hover:text-white transition-colors opacity-70 group-hover:opacity-100'
                  aria-label='More options'
                >
                  <MoreHorizontal size={13} />
                </button>

                {menuOpen && (
                  <div className='absolute right-0 top-6 w-36 bg-kr0n-surface-2 border border-kr0n-line shadow-2xl py-1 z-40 font-mono text-[10px]'>
                    <Link
                      href={`/projects/${project.id}`}
                      className='block px-3 py-1.5 text-kr0n-muted hover:text-white hover:bg-white/[0.05]'
                    >
                      Open Overview
                    </Link>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeploy) onDeploy(project.id);
                        setMenuOpen(false);
                      }}
                      className='w-full text-left px-3 py-1.5 text-kr0n-muted hover:text-white hover:bg-white/[0.05]'
                    >
                      Trigger Deploy
                    </button>
                    <button
                      type='button'
                      onClick={toggleExpand}
                      className='w-full text-left px-3 py-1.5 text-kr0n-muted hover:text-white hover:bg-white/[0.05]'
                    >
                      {isExpanded ? 'Collapse' : 'Inspect'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Minimal State & Context Metadata */}
          <div className='flex items-center justify-between text-[10px] font-mono'>
            <div className='flex items-center gap-1.5 text-kr0n-muted'>
              <span className='uppercase font-semibold text-kr0n-text-secondary'>
                {project.environment}
              </span>
              <span className='text-kr0n-faint'>·</span>
              <span className='text-kr0n-faint'>{project.services.length} services</span>
            </div>

            <div className='flex items-center gap-1 text-[10px] font-mono'>
              <span
                className={`font-medium ${
                  status.color === 'emerald'
                    ? 'text-emerald-400'
                    : status.color === 'amber'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* Compact Technical Endpoint Rail */}
          {project.url && <ProjectEndpoint url={project.url} compact />}
        </div>

        {/* ─── EXPANDED INSPECTION SURFACE ─── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className='overflow-hidden border-t border-kr0n-line bg-kr0n-black/40'
            >
              <div className='p-3.5 space-y-3 font-mono text-[10px]'>
                {/* Project Description */}
                {project.description && (
                  <p className='text-kr0n-muted leading-relaxed text-[11px] font-sans'>
                    {project.description}
                  </p>
                )}

                {/* Divider */}
                <div className='border-t border-kr0n-line-soft' />

                {/* Release & Deployment */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-kr0n-faint uppercase tracking-wider text-[9px]'>
                    <span>Release</span>
                    <span className={deployStatus.textClass}>{deployStatus.label}</span>
                  </div>
                  <div className='flex items-center justify-between text-white font-medium'>
                    <span>{project.currentDeployment.version}</span>
                    <span className='text-kr0n-faint text-[9px]'>
                      {project.currentDeployment.timestamp}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-kr0n-faint text-[9px]'>
                    <span className='flex items-center gap-1'>
                      <GitBranch size={9} />
                      {project.currentDeployment.branch}
                    </span>
                    <span>|</span>
                    <span className='text-kr0n-muted'>{project.currentDeployment.commit}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className='border-t border-kr0n-line-soft' />

                {/* Resource Telemetry */}
                <div className='space-y-1.5'>
                  <div className='text-kr0n-faint uppercase tracking-wider text-[9px]'>
                    Telemetry & Resources
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-kr0n-muted'>
                    <div className='flex items-center gap-1.5 bg-white/[0.02] p-1.5 border border-kr0n-line-soft'>
                      <Cpu size={10} className='text-kr0n-faint' />
                      <span>CPU {project.resources.cpu}%</span>
                    </div>
                    <div className='flex items-center gap-1.5 bg-white/[0.02] p-1.5 border border-kr0n-line-soft'>
                      <HardDrive size={10} className='text-kr0n-faint' />
                      <span>MEM {project.resources.memory}</span>
                    </div>
                  </div>
                </div>

                {/* Services Tags */}
                <div className='space-y-1.5'>
                  <div className='text-kr0n-faint uppercase tracking-wider text-[9px]'>
                    Services ({project.services.length})
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {project.services.map((s) => (
                      <span
                        key={s.id}
                        className='px-1.5 py-0.5 border border-kr0n-line text-kr0n-text-secondary text-[9px] bg-kr0n-surface'
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className='pt-2 border-t border-kr0n-line-soft flex items-center justify-between'>
                  <Link
                    href={`/projects/${project.id}`}
                    className='text-[10px] uppercase tracking-wider font-bold text-kr0n-muted hover:text-white transition-colors flex items-center gap-1'
                  >
                    <span>Inspect</span>
                    <ExternalLink size={9} />
                  </Link>

                  <button
                    type='button'
                    disabled={isDeploying}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeploy) onDeploy(project.id);
                    }}
                    className='clipped-btn inline-flex items-center gap-1 bg-white hover:bg-neutral-200 text-black px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold transition-colors'
                  >
                    <Rocket size={10} />
                    <span>{isDeploying ? 'Building' : 'Deploy'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
