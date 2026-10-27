'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Rocket,
  GitBranch,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  X,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import ServiceHeaderTabs from '@/components/services/ServiceHeaderTabs';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function ServiceDeploymentsPage({ params }) {
  const { projectId, serviceId } = use(params);
  const {
    projects,
    deployments,
    triggerDeploy,
    triggerRollback,
  } = useKr0nStore();

  const project = projects.find((p) => p.id === projectId);
  const service = project?.services?.find((s) => s.id === serviceId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [isDeploying, setIsDeploying] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);

  if (!project) {
    return <BrandedNotFound type='Project' id={projectId} backHref='/projects' backLabel='Back to Projects' />;
  }

  if (!service) {
    return (
      <BrandedNotFound
        type='Service'
        id={serviceId}
        backHref={`/projects/${projectId}`}
        backLabel={`Back to ${project.name}`}
      />
    );
  }

  const allDeployments = deployments[serviceId] || deployments.svc_api || [];

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      triggerDeploy(serviceId, 'Manual trigger from deployments page');
      setIsDeploying(false);
    }, 1800);
  };

  const handleRollbackConfirm = () => {
    if (selectedTarget) {
      triggerRollback(serviceId, selectedTarget.id);
      setShowRollbackModal(false);
      setSelectedTarget(null);
    }
  };

  // Filter deployments
  const filteredDeployments = allDeployments.filter((dep) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && dep.status !== 'active') return false;
      if (statusFilter === 'failed' && dep.status !== 'failed' && dep.status !== 'rejected') return false;
      if (statusFilter === 'ready' && dep.status !== 'ready') return false;
    }
    if (branchFilter !== 'all' && dep.branch !== branchFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dep.version?.toLowerCase().includes(q) ||
        dep.commit?.toLowerCase().includes(q) ||
        dep.commitMsg?.toLowerCase().includes(q) ||
        dep.author?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueBranches = Array.from(new Set(allDeployments.map((d) => d.branch).filter(Boolean)));

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      <ServiceHeaderTabs
        project={project}
        service={service}
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
      />

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6'>
        {/* Header & Filter Controls */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-xl font-bold font-mono text-white tracking-wide uppercase'>
              Deployment History
            </h1>
            <p className='text-xs font-mono text-kr0n-text-secondary mt-1'>
              Chronological build artifacts, immutable digests, and promotion lifecycle.
            </p>
          </div>

          <button
            type='button'
            disabled={isDeploying}
            onClick={handleDeploy}
            className='clipped-btn self-start sm:self-auto inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-50'
          >
            <Rocket size={13} className={isDeploying ? 'animate-spin' : ''} />
            <span>{isDeploying ? 'Deploying...' : 'Deploy Release'}</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className='p-3 border border-kr0n-line bg-kr0n-surface flex flex-wrap items-center gap-3'>
          {/* Search Input */}
          <div className='relative flex-1 min-w-[200px]'>
            <Search size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-kr0n-muted' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search commit, SHA, author...'
              className='w-full bg-kr0n-black border border-kr0n-line text-xs font-mono text-white pl-8 pr-3 py-1.5 outline-none focus:border-kr0n-line-strong'
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => setSearchQuery('')}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-kr0n-muted hover:text-white'
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status selector */}
          <div className='flex items-center gap-1 text-xs font-mono'>
            <span className='text-[10px] text-kr0n-muted uppercase font-bold mr-1'>Status:</span>
            {['all', 'active', 'ready', 'failed'].map((st) => (
              <button
                key={st}
                type='button'
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 border text-[11px] uppercase tracking-wider font-medium transition-colors ${
                  statusFilter === st
                    ? 'border-white text-white bg-white/10 font-bold'
                    : 'border-kr0n-line text-kr0n-text-secondary hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Branch selector */}
          {uniqueBranches.length > 1 && (
            <div className='flex items-center gap-1 text-xs font-mono'>
              <span className='text-[10px] text-kr0n-muted uppercase font-bold mr-1'>Branch:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className='bg-kr0n-black border border-kr0n-line text-xs text-white px-2 py-1 outline-none'
              >
                <option value='all'>All Branches</option>
                {uniqueBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Deployments Table */}
        <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft font-mono text-xs'>
          {filteredDeployments.length > 0 ? (
            filteredDeployments.map((dep) => {
              const isActive = dep.status === 'active';
              const isFailed = dep.status === 'failed' || dep.status === 'rejected';

              return (
                <div
                  key={dep.id}
                  className='p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors'
                >
                  <div className='flex items-start gap-4 min-w-0'>
                    <div
                      className={`w-7 h-7 border flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                          : isFailed
                          ? 'border-red-400/40 bg-red-400/10 text-red-400'
                          : 'border-kr0n-line bg-kr0n-black text-kr0n-muted'
                      }`}
                    >
                      <GitBranch size={13} />
                    </div>

                    <div className='space-y-1 min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Link
                          href={`/projects/${projectId}/services/${serviceId}/deployments/${dep.id}`}
                          className='text-white font-bold text-sm hover:underline'
                        >
                          {dep.version}
                        </Link>
                        <span className='text-kr0n-muted'>·</span>
                        <span className='text-kr0n-text-secondary'>{dep.commit}</span>
                        <span className='text-kr0n-muted'>·</span>
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                              : dep.status === 'rejected'
                              ? 'bg-red-400/10 text-red-400 border border-red-400/30'
                              : isFailed
                              ? 'bg-red-400/10 text-red-400'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {dep.status === 'rejected' ? 'REJECTED (QUOTA)' : dep.status}
                        </span>
                        {isActive && (
                          <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                        )}
                      </div>

                      <p className='text-xs text-kr0n-text-secondary truncate max-w-xl font-sans'>
                        {dep.commitMsg}
                      </p>

                      <div className='text-[10px] text-kr0n-muted flex flex-wrap items-center gap-2 pt-0.5'>
                        <span>by <strong className='text-white'>{dep.author}</strong></span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>branch: <span className='text-white'>{dep.branch}</span></span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>duration: <span className='text-white'>{dep.duration}</span></span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>{dep.timestamp}</span>
                        {dep.trigger && (
                          <>
                            <span className='text-kr0n-line-strong'>|</span>
                            <span className='text-kr0n-text-secondary'>via {dep.trigger}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-2.5 self-end lg:self-center shrink-0'>
                    <Link
                      href={`/projects/${projectId}/services/${serviceId}/deployments/${dep.id}`}
                      className='px-3 py-1.5 border border-kr0n-line hover:border-kr0n-line-strong text-[11px] text-kr0n-text-secondary hover:text-white transition-colors font-medium'
                    >
                      Inspect Details →
                    </Link>

                    {!isActive && !isFailed && (
                      <button
                        type='button'
                        onClick={() => {
                          setSelectedTarget(dep);
                          setShowRollbackModal(true);
                        }}
                        className='px-3 py-1.5 border border-kr0n-line hover:border-amber-400/40 text-[11px] text-kr0n-text-secondary hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5'
                      >
                        <RotateCcw size={11} />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className='p-12 text-center space-y-3 font-sans'>
              <div className='w-10 h-10 border border-kr0n-line bg-kr0n-black flex items-center justify-center mx-auto text-kr0n-muted'>
                <Filter size={16} />
              </div>
              <h3 className='text-sm font-mono font-bold text-white uppercase'>No Deployments Match Criteria</h3>
              <p className='text-xs text-kr0n-text-secondary max-w-sm mx-auto'>
                Try clearing your search query or switching the status filter to see other releases.
              </p>
              <button
                type='button'
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setBranchFilter('all');
                }}
                className='text-xs font-mono text-white underline underline-offset-4'
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Rollback Modal ─── */}
      {showRollbackModal && selectedTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-5 font-mono text-xs shadow-2xl'>
            <div className='space-y-1.5'>
              <h3 className='text-sm font-bold text-white uppercase'>Initiate Rollback</h3>
              <p className='text-kr0n-text-secondary font-sans leading-relaxed'>
                Are you sure you want to rollback to release <strong className='text-white'>{selectedTarget.version}</strong> ({selectedTarget.commit})?
                kr0n will create a new desired state matching this snapshot and promote it once healthcheck probes pass.
              </p>
            </div>

            <div className='p-3 border border-kr0n-line bg-kr0n-black space-y-1 text-[11px]'>
              <div className='text-white font-bold'>{selectedTarget.commitMsg}</div>
              <div className='text-kr0n-muted'>Author: {selectedTarget.author} · Duration: {selectedTarget.duration}</div>
            </div>

            <div className='flex items-center justify-end gap-3 pt-2'>
              <button
                type='button'
                onClick={() => setShowRollbackModal(false)}
                className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleRollbackConfirm}
                className='clipped-btn bg-amber-400 hover:bg-amber-300 text-black px-4 py-1.5 font-bold uppercase tracking-wider'
              >
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
