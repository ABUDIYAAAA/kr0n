'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Rocket,
  Globe,
  GitBranch,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Terminal,
  Clock,
  CheckCircle2,
  ExternalLink,
  Settings as SettingsIcon,
  ShieldCheck,
  RefreshCw,
  Copy,
  Pause,
  Play,
} from 'lucide-react';
import { PROJECTS, STATUS_CONFIG, DEPLOYMENT_STATUS_CONFIG } from '@/lib/projects-data';

export default function ProjectDetailPage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;

  const project = PROJECTS.find((p) => p.id === projectId) || PROJECTS[0];

  const [activeTab, setActiveTab] = useState('overview');
  const [isDeploying, setIsDeploying] = useState(false);
  const [logsPaused, setLogsPaused] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [logs, setLogs] = useState([
    { id: 1, time: '14:22:01.102', level: 'INFO', msg: '[kr0n-edge] Router initialized on cluster us-east-1' },
    { id: 2, time: '14:22:01.450', level: 'INFO', msg: '[kr0n-worker] Healthcheck probe responded 200 OK in 2.1ms' },
    { id: 3, time: '14:22:03.881', level: 'DEBUG', msg: `[upstream] Connection pool warm: 12 connections ready` },
    { id: 4, time: '14:22:08.219', level: 'INFO', msg: `[traffic] GET /api/v1/health status=200 latency=1.8ms` },
    { id: 5, time: '14:22:14.041', level: 'INFO', msg: `[traffic] GET /api/v1/inventory status=200 latency=6.4ms (cache=HIT)` },
  ]);

  // Simulate streaming logs
  useEffect(() => {
    if (logsPaused) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const endpoints = ['/api/v1/checkout', '/api/v1/cart', '/api/v1/products', '/api/v1/auth/session'];
      const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
      const lat = (Math.random() * 12 + 1).toFixed(1);

      setLogs((prev) => [
        ...prev.slice(-15),
        {
          id: Date.now(),
          time: timeStr,
          level: 'INFO',
          msg: `[traffic] GET ${ep} status=200 latency=${lat}ms (edge-route=us-east)`,
        },
      ]);
    }, 2800);

    return () => clearInterval(interval);
  }, [logsPaused]);

  const handleTriggerDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
    }, 3000);
  };

  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.healthy;

  return (
    <div className='flex-1 overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Breadcrumb Navigation Bar ─── */}
      <div className='h-12 border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-sm flex items-center justify-between px-6'>
        <div className='flex items-center gap-3 text-xs font-mono'>
          <Link
            href='/projects'
            className='flex items-center gap-1 text-kr0n-muted hover:text-white transition-colors uppercase tracking-wider'
          >
            <ArrowLeft size={12} />
            <span>Projects</span>
          </Link>
          <span className='text-kr0n-faint'>/</span>
          <span className='text-white font-bold uppercase tracking-wider'>
            {project.name}
          </span>
          <span className='px-1.5 py-0.5 border border-kr0n-line text-[10px] text-kr0n-faint uppercase'>
            {project.environment}
          </span>
        </div>

        <div className='flex items-center gap-3'>
          {project.url && (
            <a
              href={`https://${project.url}`}
              target='_blank'
              rel='noopener noreferrer'
              className='hidden sm:flex items-center gap-1.5 text-xs font-mono text-kr0n-muted hover:text-white transition-colors'
            >
              <span>{project.url}</span>
              <ExternalLink size={11} />
            </a>
          )}
          <button
            type='button'
            disabled={isDeploying}
            onClick={handleTriggerDeploy}
            className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-50'
          >
            {isDeploying ? (
              <>
                <span className='w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin' />
                Deploying...
              </>
            ) : (
              <>
                <Rocket size={12} />
                Deploy Release
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Project Header ─── */}
      <div className='px-6 sm:px-8 py-8 border-b border-kr0n-line bg-kr0n-black/40'>
        <div className='max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <span
                className={`w-3 h-3 rounded-full ${status.dotClass} ${
                  project.status === 'healthy' || isDeploying ? 'animate-pulse' : ''
                }`}
              />
              <h1 className='text-2xl sm:text-3xl font-black font-mono tracking-wider text-white uppercase'>
                {project.name}
              </h1>
              <span className='px-2 py-0.5 border border-kr0n-line bg-kr0n-surface text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-widest'>
                {project.environment}
              </span>
            </div>
            <p className='text-sm text-kr0n-muted max-w-xl'>
              {project.description}
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className='grid grid-cols-3 gap-3 font-mono text-xs'>
            <div className='border border-kr0n-line bg-kr0n-surface p-3 min-w-28'>
              <div className='text-[10px] text-kr0n-faint uppercase'>Services</div>
              <div className='text-base font-bold text-white mt-1'>
                {project.services.length} active
              </div>
            </div>
            <div className='border border-kr0n-line bg-kr0n-surface p-3 min-w-28'>
              <div className='text-[10px] text-kr0n-faint uppercase'>CPU Usage</div>
              <div className='text-base font-bold text-white mt-1'>
                {project.resources.cpu}%
              </div>
            </div>
            <div className='border border-kr0n-line bg-kr0n-surface p-3 min-w-28'>
              <div className='text-[10px] text-kr0n-faint uppercase'>Memory</div>
              <div className='text-base font-bold text-white mt-1'>
                {project.resources.memory}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='max-w-6xl mx-auto flex items-center gap-6 mt-8 border-b border-kr0n-line-soft font-mono text-xs uppercase tracking-wider'>
          {['overview', 'services', 'deployments', 'logs', 'environment'].map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveTab(tab)}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-kr0n-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className='max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-8'>
        {/* Services Overview */}
        {(activeTab === 'overview' || activeTab === 'services') && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-faint'>
                Registered Services
              </h2>
              <span className='text-[11px] font-mono text-kr0n-muted'>
                {project.services.length} Microservices running on KR0N Edge
              </span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {project.services.map((svc) => (
                <div
                  key={svc.id}
                  className='border border-kr0n-line bg-kr0n-surface hover:border-kr0n-line-strong p-5 space-y-4 transition-colors'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-emerald-400' />
                      <span className='font-mono font-bold text-white text-sm uppercase'>
                        {svc.name}
                      </span>
                    </div>
                    <span className='text-[10px] font-mono px-2 py-0.5 border border-kr0n-line text-kr0n-faint uppercase'>
                      {svc.type}
                    </span>
                  </div>

                  <div className='space-y-2 text-xs font-mono text-kr0n-muted'>
                    <div className='flex justify-between'>
                      <span className='text-kr0n-faint'>Runtime:</span>
                      <span className='text-kr0n-text-secondary'>KR0N V8 Edge Worker</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-kr0n-faint'>Instances:</span>
                      <span className='text-kr0n-text-secondary'>3 auto-scaled</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-kr0n-faint'>Health:</span>
                      <span className='text-emerald-400'>100% Passing</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Railway-style Deployments Rail */}
        {(activeTab === 'overview' || activeTab === 'deployments') && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-faint'>
                Deployment Release Rail
              </h2>
              <span className='text-[11px] font-mono text-kr0n-muted'>
                Showing recent revisions
              </span>
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft font-mono'>
              {[
                {
                  version: project.currentDeployment.version,
                  commit: project.currentDeployment.commit,
                  branch: project.currentDeployment.branch,
                  time: project.currentDeployment.timestamp,
                  author: 'alex.chen',
                  msg: 'optimize edge routing and streaming response headers',
                  status: project.currentDeployment.status,
                },
                {
                  version: 'v1.8.3',
                  commit: 'b94e21a',
                  branch: 'main',
                  time: '2h ago',
                  author: 'sarah.m',
                  msg: 'bump telemetry instrumentation and grpc bindings',
                  status: 'live',
                },
                {
                  version: 'v1.8.2',
                  commit: '48c10fa',
                  branch: 'main',
                  time: '1d ago',
                  author: 'gurmehar',
                  msg: 'hotfix database query connection pooling timeout',
                  status: 'live',
                },
              ].map((dep, idx) => (
                <div
                  key={dep.commit}
                  className='p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors'
                >
                  <div className='flex items-start gap-4'>
                    <div className='w-6 h-6 border border-kr0n-line bg-kr0n-black flex items-center justify-center shrink-0 mt-0.5'>
                      <GitBranch size={12} className='text-kr0n-muted' />
                    </div>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2 text-xs'>
                        <span className='text-white font-bold'>{dep.version}</span>
                        <span className='text-kr0n-faint'>·</span>
                        <span className='text-kr0n-muted'>{dep.commit}</span>
                        <span className='text-kr0n-faint'>·</span>
                        <span className='text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 text-[10px]'>
                          {dep.status}
                        </span>
                      </div>
                      <p className='text-xs text-kr0n-text-secondary'>{dep.msg}</p>
                      <div className='text-[10px] text-kr0n-faint flex items-center gap-2'>
                        <span>by {dep.author}</span>
                        <span>|</span>
                        <span>{dep.branch}</span>
                        <span>|</span>
                        <span>{dep.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 self-end sm:self-center'>
                    <button
                      type='button'
                      onClick={() => setActiveTab('logs')}
                      className='px-2.5 py-1 border border-kr0n-line text-[11px] text-kr0n-muted hover:text-white hover:border-kr0n-line-strong transition-colors'
                    >
                      Logs
                    </button>
                    {idx > 0 && (
                      <button
                        type='button'
                        className='px-2.5 py-1 border border-kr0n-line text-[11px] text-kr0n-muted hover:text-amber-400 hover:border-amber-400/40 transition-colors'
                      >
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Terminal Log Stream */}
        {(activeTab === 'overview' || activeTab === 'logs') && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Terminal size={14} className='text-kr0n-faint' />
                <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-faint'>
                  Edge Runtime Logs (Live)
                </h2>
              </div>
              <div className='flex items-center gap-2 font-mono text-[11px]'>
                <button
                  type='button'
                  onClick={() => setLogsPaused(!logsPaused)}
                  className='flex items-center gap-1.5 px-2 py-1 border border-kr0n-line text-kr0n-muted hover:text-white transition-colors'
                >
                  {logsPaused ? <Play size={10} /> : <Pause size={10} />}
                  <span>{logsPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  type='button'
                  onClick={() => {
                    navigator.clipboard.writeText(logs.map((l) => `${l.time} ${l.msg}`).join('\n'));
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className='flex items-center gap-1.5 px-2 py-1 border border-kr0n-line text-kr0n-muted hover:text-white transition-colors'
                >
                  <Copy size={10} />
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className='border border-kr0n-line bg-kr0n-black p-4 font-mono text-xs leading-relaxed space-y-1 overflow-x-auto max-h-72 select-text'>
              {logs.map((log) => (
                <div key={log.id} className='flex items-start gap-3 text-kr0n-muted'>
                  <span className='text-kr0n-faint shrink-0 select-none'>{log.time}</span>
                  <span
                    className={`shrink-0 font-bold ${
                      log.level === 'INFO'
                        ? 'text-emerald-400'
                        : log.level === 'WARN'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                  >
                    [{log.level}]
                  </span>
                  <span className='text-kr0n-text-secondary'>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment Variables Tab */}
        {activeTab === 'environment' && (
          <div className='space-y-4 font-mono'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xs uppercase tracking-widest text-kr0n-faint'>
                Environment Variables & Secrets
              </h2>
              <button
                type='button'
                className='px-3 py-1 border border-kr0n-line bg-white/5 text-white text-xs hover:border-white transition-colors'
              >
                + Add Variable
              </button>
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft text-xs'>
              {[
                { key: 'DATABASE_URL', val: 'postgresql://kr0n_admin:••••••••@edge.db:5432/main' },
                { key: 'KR0N_SIGNING_SECRET', val: 'kr0n_sec_••••••••••••••••••••••••' },
                { key: 'REDIS_CACHE_URL', val: 'redis://default:••••••••@cache.kr0n.internal:6379' },
                { key: 'NODE_ENV', val: 'production' },
              ].map((item) => (
                <div key={item.key} className='p-4 flex items-center justify-between'>
                  <span className='font-bold text-white'>{item.key}</span>
                  <span className='text-kr0n-muted'>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
