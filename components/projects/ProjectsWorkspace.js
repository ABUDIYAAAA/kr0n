'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProjectCard from './ProjectCard';
import ProjectConnector from './ProjectConnector';
import ProjectsToolbar from './ProjectsToolbar';
import NewProjectModal from './NewProjectModal';
import { PROJECTS } from '@/lib/projects-data';
import { Plus, Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsWorkspace() {
  const [projects, setProjects] = useState(() =>
    PROJECTS.map((p) => ({
      ...p,
      _x: p.position.x,
      _y: p.position.y,
    }))
  );
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [viewMode, setViewMode] = useState('canvas');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [cardHeights, setCardHeights] = useState({});
  const canvasRef = useRef(null);

  const handleHeightChange = useCallback((id, h) => {
    setCardHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    // Environment / Attention filter
    if (filter === 'production' && p.environment !== 'production') return false;
    if (filter === 'staging' && p.environment !== 'staging') return false;
    if (filter === 'attention' && p.status !== 'warning' && p.status !== 'failed') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.environment.toLowerCase().includes(q) ||
        p.services.some((s) => s.name.toLowerCase().includes(q)) ||
        (p.url && p.url.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Update project position on drag
  const handleDrag = useCallback((id, x, y) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, _x: x, _y: y } : p))
    );
  }, []);

  const handleDragStart = useCallback((id) => {
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Deploy simulation trigger
  const handleDeploy = useCallback((id) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    setToastMessage({
      type: 'info',
      title: 'Deployment Triggered',
      desc: `Building commit for ${target.name} (${target.environment})...`,
    });

    // Mark as deploying
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              currentDeployment: {
                ...p.currentDeployment,
                status: 'deploying',
                commit: Math.random().toString(16).substring(2, 9),
              },
            }
          : p
      )
    );

    // Simulate completion after 3 seconds
    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'healthy',
                deploymentCount: p.deploymentCount + 1,
                currentDeployment: {
                  ...p.currentDeployment,
                  status: 'live',
                  timestamp: 'Just now',
                },
              }
            : p
        )
      );

      setToastMessage({
        type: 'success',
        title: 'Release Published',
        desc: `${target.name} (${target.environment}) is live on edge nodes.`,
      });

      setTimeout(() => setToastMessage(null), 4000);
    }, 3200);
  }, [projects]);

  // Create new project
  const handleCreateProject = useCallback((newProj) => {
    setProjects((prev) => [newProj, ...prev]);
    setToastMessage({
      type: 'success',
      title: 'Project Spawned',
      desc: `${newProj.name} created and deployed to ${newProj.environment}.`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Collect connector pairs
  const connectors = [];
  const seen = new Set();
  projects.forEach((p) => {
    if (p.linkedTo && !seen.has(`${p.id}-${p.linkedTo}`) && !seen.has(`${p.linkedTo}-${p.id}`)) {
      const target = projects.find((t) => t.id === p.linkedTo);
      if (target) {
        connectors.push({ from: p, to: target });
        seen.add(`${p.id}-${p.linkedTo}`);
      }
    }
  });

  return (
    <div className='flex flex-col h-full bg-kr0n-canvas relative select-none'>
      {/* Workspace Toolbar */}
      <ProjectsToolbar
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projectCount={filteredProjects.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewProject={() => setIsNewModalOpen(true)}
      />

      {/* Main Content Area: Canvas or Grid */}
      {viewMode === 'canvas' ? (
        <div
          ref={canvasRef}
          className='flex-1 relative overflow-auto focus:outline-none'
          style={{
            background: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 70%)`,
          }}
        >
          {/* Faint technical dot matrix */}
          <div
            className='absolute inset-0 pointer-events-none'
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
              minWidth: 1600,
              minHeight: 1100,
            }}
          />

          {/* Canvas status coordinate bar */}
          <div className='absolute bottom-3 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-4 text-[10px] font-mono text-kr0n-faint uppercase'>
            <span className='flex items-center gap-1.5'>
              <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
              WORKSPACE RUNTIME ACTIVE
            </span>
            <span>|</span>
            <span>DRAG CARDS TO REORGANIZE</span>
            <span>|</span>
            <span>ARROW KEYS WHEN FOCUSED</span>
          </div>

          {/* SVG Connector Layer */}
          <svg
            className='absolute inset-0 pointer-events-none'
            style={{ minWidth: 1600, minHeight: 1100, zIndex: 1 }}
          >
            {connectors.map(({ from, to }) => (
              <ProjectConnector
                key={`${from.id}-${to.id}`}
                fromCard={from}
                toCard={to}
                fromHeight={cardHeights[from.id] || 120}
                toHeight={cardHeights[to.id] || 120}
                isActive={draggingId === from.id || draggingId === to.id}
                label={`${from.name.toUpperCase()} REPLICATION`}
              />
            ))}
          </svg>

          {/* Draggable Card Objects */}
          <div
            className='relative'
            style={{ minWidth: 1600, minHeight: 1100, zIndex: 2 }}
          >
            <AnimatePresence mode='popLayout'>
              {filteredProjects.length === 0 ? (
                <motion.div
                  key='empty'
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className='absolute inset-0 flex items-center justify-center'
                  style={{ minHeight: 600 }}
                >
                  <div className='text-center space-y-4 max-w-sm px-6'>
                    <div className='w-12 h-12 mx-auto border border-kr0n-line bg-kr0n-surface flex items-center justify-center'>
                      <Plus size={20} className='text-kr0n-faint' />
                    </div>
                    <div className='space-y-1.5'>
                      <p className='text-sm text-white font-mono uppercase tracking-wider font-bold'>
                        {searchQuery ? 'No matching projects found' : 'No projects in this view'}
                      </p>
                      <p className='text-xs text-kr0n-muted leading-relaxed'>
                        {searchQuery
                          ? 'Adjust your query or clear filters to view application objects.'
                          : 'Create your first application workspace or switch filters.'}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => setIsNewModalOpen(true)}
                      className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
                    >
                      <Plus size={13} />
                      Create project
                    </button>
                  </div>
                </motion.div>
              ) : (
                filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onDrag={handleDrag}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingId === project.id}
                    onDeploy={handleDeploy}
                    onHeightChange={handleHeightChange}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Structured List / Grid View */
        <div className='flex-1 overflow-auto p-6 sm:p-8 max-w-7xl mx-auto w-full'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className='relative'
                style={{ width: 268 }}
              >
                <ProjectCard
                  project={{ ...project, _x: 0, _y: 0 }}
                  index={index}
                  onDrag={() => {}}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  isDragging={false}
                  onDeploy={handleDeploy}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Status Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className='fixed bottom-6 right-6 z-50 bg-kr0n-surface-2 border border-kr0n-line shadow-2xl p-4 flex items-start gap-3 max-w-sm'
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={16} className='text-emerald-400 shrink-0 mt-0.5' />
            ) : (
              <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5' />
            )}
            <div className='space-y-0.5 text-xs font-mono'>
              <div className='text-white font-bold'>{toastMessage.title}</div>
              <div className='text-kr0n-muted leading-relaxed'>{toastMessage.desc}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Project Creation Modal */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
