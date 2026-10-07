'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Pause,
  Play,
  Download,
  ChevronDown,
  Filter,
  X,
  Terminal,
  Radio,
} from 'lucide-react';
import {
  MOCK_SERVICE,
  MOCK_DEPLOYMENTS,
  LOG_LEVEL_CONFIG,
  generateInitialLogs,
  generateStreamLog,
} from '@/lib/observability-data';

export default function LogsPage({ params }) {
  const { projectId, serviceId } = use(params);

  const [logs, setLogs] = useState(() => generateInitialLogs(40));
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [deploymentFilter, setDeploymentFilter] = useState('all');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showDeployDropdown, setShowDeployDropdown] = useState(false);
  const [showInstanceDropdown, setShowInstanceDropdown] = useState(false);

  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Stream new logs when live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, generateStreamLog()];
        return next.slice(-200); // Keep last 200 entries
      });
    }, 1800 + Math.random() * 1200);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!userScrolled && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, userScrolled]);

  const handleScroll = useCallback(() => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setUserScrolled(!atBottom);
  }, []);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (deploymentFilter !== 'all' && log.deployment !== deploymentFilter) return false;
    if (instanceFilter !== 'all' && log.instance !== instanceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q) ||
        log.time.includes(q)
      );
    }
    return true;
  });

  const handleDownload = () => {
    const content = filteredLogs
      .map((l) => `${l.time}\t${l.level}\t${l.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kr0n-logs-${MOCK_SERVICE.serviceName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex flex-col h-full bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Service Context Header ─── */}
      <div className='h-12 border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0'>
        <div className='flex items-center gap-3 text-xs font-mono'>
          <Link
            href={`/projects/${projectId}`}
            className='flex items-center gap-1 text-kr0n-muted hover:text-white transition-colors uppercase tracking-wider'
          >
            <ArrowLeft size={12} />
            <span className='hidden sm:inline'>Project</span>
          </Link>
          <span className='text-kr0n-faint'>/</span>
          <span className='text-white font-bold uppercase tracking-wider'>
            {MOCK_SERVICE.serviceName}
          </span>
          <span className='px-1.5 py-0.5 border border-kr0n-line text-[10px] text-kr0n-faint uppercase'>
            {MOCK_SERVICE.environment}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          {/* Service nav tabs */}
          <nav className='hidden md:flex items-center gap-0 text-[11px] font-mono uppercase tracking-wider'>
            {[
              { label: 'Overview', href: `/projects/${projectId}/services/${serviceId}` },
              { label: 'Deployments', href: `/projects/${projectId}/services/${serviceId}/deployments` },
              { label: 'Logs', href: `/projects/${projectId}/services/${serviceId}/logs`, active: true },
              { label: 'Metrics', href: `/projects/${projectId}/services/${serviceId}/metrics` },
              { label: 'Settings', href: `/projects/${projectId}/services/${serviceId}/settings` },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-3 py-3 border-b-2 transition-colors ${
                  tab.active
                    ? 'border-white text-white'
                    : 'border-transparent text-kr0n-faint hover:text-kr0n-muted'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Logs Header ─── */}
      <div className='px-4 sm:px-6 py-4 border-b border-kr0n-line-soft bg-kr0n-black/30 shrink-0'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Terminal size={16} className='text-kr0n-faint' />
            <h1 className='text-sm font-bold text-white tracking-wide'>Logs</h1>
            <div className='flex items-center gap-1.5'>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-kr0n-faint'}`} />
              <span className={`text-[11px] font-mono ${isLive ? 'text-emerald-400' : 'text-kr0n-faint'}`}>
                {isLive ? 'Live' : 'Paused'}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setIsLive(!isLive)}
              className='flex items-center gap-1.5 px-2.5 py-1.5 border border-kr0n-line text-[11px] font-mono text-kr0n-muted hover:text-white hover:border-kr0n-line-strong transition-colors'
            >
              {isLive ? <Pause size={11} /> : <Play size={11} />}
              <span>{isLive ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              type='button'
              onClick={handleDownload}
              className='flex items-center gap-1.5 px-2.5 py-1.5 border border-kr0n-line text-[11px] font-mono text-kr0n-muted hover:text-white hover:border-kr0n-line-strong transition-colors'
              title='Export logs'
            >
              <Download size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      <div className='px-4 sm:px-6 py-2.5 border-b border-kr0n-line-soft bg-kr0n-surface/50 shrink-0'>
        <div className='flex items-center gap-2 flex-wrap'>
          {/* Search */}
          <div className='relative flex-1 min-w-[180px] max-w-sm'>
            <Search size={12} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-kr0n-faint' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search logs...'
              className='w-full bg-kr0n-black/60 border border-kr0n-line text-xs font-mono text-kr0n-text pl-7 pr-3 py-1.5 placeholder:text-kr0n-faint focus:border-kr0n-line-strong focus:outline-none transition-colors'
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => setSearchQuery('')}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-kr0n-faint hover:text-white'
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Level filter */}
          <div className='relative'>
            <button
              type='button'
              onClick={() => { setShowLevelDropdown(!showLevelDropdown); setShowDeployDropdown(false); setShowInstanceDropdown(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] font-mono transition-colors ${
                levelFilter !== 'all'
                  ? 'border-kr0n-line-strong text-white bg-white/[0.04]'
                  : 'border-kr0n-line text-kr0n-muted hover:text-white hover:border-kr0n-line-strong'
              }`}
            >
              <span>Level{levelFilter !== 'all' ? `: ${levelFilter}` : ''}</span>
              <ChevronDown size={10} />
            </button>
            {showLevelDropdown && (
              <div className='absolute top-full left-0 mt-1 z-20 bg-kr0n-surface border border-kr0n-line min-w-[120px] py-1 shadow-xl'>
                {['all', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((level) => (
                  <button
                    key={level}
                    type='button'
                    onClick={() => { setLevelFilter(level); setShowLevelDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                      levelFilter === level ? 'text-white bg-white/[0.06]' : 'text-kr0n-muted hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Deployment filter */}
          <div className='relative'>
            <button
              type='button'
              onClick={() => { setShowDeployDropdown(!showDeployDropdown); setShowLevelDropdown(false); setShowInstanceDropdown(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] font-mono transition-colors ${
                deploymentFilter !== 'all'
                  ? 'border-kr0n-line-strong text-white bg-white/[0.04]'
                  : 'border-kr0n-line text-kr0n-muted hover:text-white hover:border-kr0n-line-strong'
              }`}
            >
              <span>Deployment{deploymentFilter !== 'all' ? `: ${deploymentFilter}` : ''}</span>
              <ChevronDown size={10} />
            </button>
            {showDeployDropdown && (
              <div className='absolute top-full left-0 mt-1 z-20 bg-kr0n-surface border border-kr0n-line min-w-[140px] py-1 shadow-xl'>
                <button
                  type='button'
                  onClick={() => { setDeploymentFilter('all'); setShowDeployDropdown(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                    deploymentFilter === 'all' ? 'text-white bg-white/[0.06]' : 'text-kr0n-muted hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  All Deployments
                </button>
                {MOCK_DEPLOYMENTS.map((dep) => (
                  <button
                    key={dep.id}
                    type='button'
                    onClick={() => { setDeploymentFilter(dep.version); setShowDeployDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                      deploymentFilter === dep.version ? 'text-white bg-white/[0.06]' : 'text-kr0n-muted hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    {dep.version}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Instance filter */}
          <div className='relative'>
            <button
              type='button'
              onClick={() => { setShowInstanceDropdown(!showInstanceDropdown); setShowLevelDropdown(false); setShowDeployDropdown(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] font-mono transition-colors ${
                instanceFilter !== 'all'
                  ? 'border-kr0n-line-strong text-white bg-white/[0.04]'
                  : 'border-kr0n-line text-kr0n-muted hover:text-white hover:border-kr0n-line-strong'
              }`}
            >
              <span>Instance{instanceFilter !== 'all' ? `: ${instanceFilter.split('-').pop()}` : ''}</span>
              <ChevronDown size={10} />
            </button>
            {showInstanceDropdown && (
              <div className='absolute top-full left-0 mt-1 z-20 bg-kr0n-surface border border-kr0n-line min-w-[160px] py-1 shadow-xl'>
                <button
                  type='button'
                  onClick={() => { setInstanceFilter('all'); setShowInstanceDropdown(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                    instanceFilter === 'all' ? 'text-white bg-white/[0.06]' : 'text-kr0n-muted hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  All Instances
                </button>
                {MOCK_SERVICE.instances.map((inst) => (
                  <button
                    key={inst.id}
                    type='button'
                    onClick={() => { setInstanceFilter(inst.name); setShowInstanceDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                      instanceFilter === inst.name ? 'text-white bg-white/[0.06]' : 'text-kr0n-muted hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    {inst.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active filter indicators */}
          {(levelFilter !== 'all' || deploymentFilter !== 'all' || instanceFilter !== 'all' || searchQuery) && (
            <button
              type='button'
              onClick={() => { setLevelFilter('all'); setDeploymentFilter('all'); setInstanceFilter('all'); setSearchQuery(''); }}
              className='flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono text-kr0n-muted hover:text-white transition-colors'
            >
              <X size={10} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ─── Log Viewer (Terminal) ─── */}
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto overflow-x-hidden bg-kr0n-black'
        onClick={() => { setShowLevelDropdown(false); setShowDeployDropdown(false); setShowInstanceDropdown(false); }}
      >
        <div className='font-mono text-[12px] leading-[1.8] select-text'>
          <AnimatePresence initial={false}>
            {filteredLogs.map((log) => {
              const levelConfig = LOG_LEVEL_CONFIG[log.level] || LOG_LEVEL_CONFIG.INFO;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className='flex items-start border-b border-white/[0.03] hover:bg-white/[0.02] px-4 sm:px-6 py-[3px] group transition-colors'
                >
                  {/* Timestamp */}
                  <span className='text-kr0n-faint shrink-0 w-[96px] select-all tabular-nums'>
                    {log.time}
                  </span>

                  {/* Level badge */}
                  <span className={`shrink-0 w-[52px] font-bold text-[11px] ${levelConfig.color}`}>
                    {log.level}
                  </span>

                  {/* Message */}
                  <span className='flex-1 min-w-0'>
                    {log.method ? (
                      <>
                        <span className='text-kr0n-text-secondary font-medium'>{log.method}</span>
                        <span className='text-kr0n-muted mx-1.5'>{log.path}</span>
                        <span className={`${log.status >= 400 ? 'text-red-400' : log.status >= 300 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {log.status}
                        </span>
                        <span className='text-kr0n-faint ml-1.5'>{log.latency}ms</span>
                      </>
                    ) : (
                      <span className='text-kr0n-text-secondary'>{log.message}</span>
                    )}
                  </span>

                  {/* Instance (on hover) */}
                  <span className='hidden sm:inline text-kr0n-faint text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3'>
                    {log.instance}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ─── Bottom Status Bar ─── */}
      <div className='h-7 border-t border-kr0n-line bg-kr0n-surface/80 flex items-center justify-between px-4 sm:px-6 text-[10px] font-mono shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5'>
            {isLive ? (
              <Radio size={9} className='text-emerald-400' />
            ) : (
              <Pause size={9} className='text-kr0n-faint' />
            )}
            <span className={isLive ? 'text-emerald-400' : 'text-kr0n-faint'}>
              {isLive ? 'STREAMING' : 'PAUSED'}
            </span>
          </div>
          <span className='text-kr0n-line-strong'>|</span>
          <span className='text-kr0n-faint'>
            {filteredLogs.length.toLocaleString()} lines
          </span>
          {(levelFilter !== 'all' || deploymentFilter !== 'all' || instanceFilter !== 'all' || searchQuery) && (
            <>
              <span className='text-kr0n-line-strong'>|</span>
              <span className='text-kr0n-faint'>filtered</span>
            </>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-kr0n-faint'>
            {MOCK_SERVICE.serviceName} · {MOCK_SERVICE.environment}
          </span>
          <span className='text-kr0n-line-strong'>|</span>
          <span className='text-kr0n-faint'>
            {MOCK_SERVICE.currentDeployment.version}
          </span>
        </div>
      </div>
    </div>
  );
}
