'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Rocket,
  RotateCw,
  GitBranch,
  ShieldCheck,
  Activity,
  Layers,
  Terminal,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function ServiceHeaderTabs({
  project,
  service,
  onDeploy,
  onRestart,
  isDeploying = false,
  isRestarting = false,
}) {
  const pathname = usePathname();
  const projectId = project?.id;
  const serviceId = service?.id;

  const tabs = [
    { label: 'Overview', href: `/projects/${projectId}/services/${serviceId}`, exact: true },
    { label: 'Deployments', href: `/projects/${projectId}/services/${serviceId}/deployments` },
    { label: 'Logs', href: `/projects/${projectId}/services/${serviceId}/logs` },
    { label: 'Metrics', href: `/projects/${projectId}/services/${serviceId}/metrics` },
    { label: 'Settings', href: `/projects/${projectId}/services/${serviceId}/settings` },
  ];

  const isTabActive = (tab) => {
    if (tab.exact) {
      return pathname === tab.href;
    }
    return pathname.startsWith(tab.href);
  };

  const isHealthy = service?.healthCheck?.status === 'healthy' || service?.healthCheck?.status !== 'warning';

  return (
    <div className='border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-sm shrink-0'>
      {/* ─── Breadcrumb & Action Bar ─── */}
      <div className='h-12 flex items-center justify-between px-4 sm:px-6 border-b border-kr0n-line-soft'>
        <div className='flex items-center gap-2.5 text-xs font-mono'>
          <Link
            href={`/projects/${projectId}`}
            className='flex items-center gap-1 text-kr0n-text-secondary hover:text-white transition-colors uppercase tracking-wider font-medium'
          >
            <ArrowLeft size={12} />
            <span className='hidden sm:inline'>{project?.name || 'Project'}</span>
          </Link>
          <span className='text-kr0n-muted'>/</span>
          <span className='text-white font-bold uppercase tracking-wider'>
            {service?.name || serviceId}
          </span>
          <span className='px-1.5 py-0.5 border border-kr0n-line text-[10px] text-kr0n-text-secondary uppercase font-bold bg-kr0n-surface'>
            {project?.environment || 'production'}
          </span>
          <span className='hidden md:inline-flex items-center gap-1 px-2 py-0.5 border border-kr0n-line text-[10px] text-kr0n-text-secondary font-mono'>
            <span className='w-1.5 h-1.5 rounded-full bg-blue-400' />
            <span>{service?.runtime || 'Long-running'}</span>
          </span>
        </div>

        <div className='flex items-center gap-2.5'>
          {service?.url && (
            <a
              href={`https://${service.url}`}
              target='_blank'
              rel='noopener noreferrer'
              className='hidden sm:flex items-center gap-1.5 text-xs font-mono text-kr0n-text-secondary hover:text-white transition-colors font-medium mr-2'
            >
              <span>{service.url}</span>
              <ExternalLink size={11} />
            </a>
          )}

          {onRestart && (
            <button
              type='button'
              onClick={onRestart}
              disabled={isRestarting || isDeploying}
              className='hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-kr0n-line text-xs font-mono text-kr0n-text-secondary hover:text-white hover:border-kr0n-line-strong transition-colors font-medium disabled:opacity-50'
            >
              <RotateCw size={11} className={isRestarting ? 'animate-spin' : ''} />
              <span>{isRestarting ? 'Restarting...' : 'Restart'}</span>
            </button>
          )}

          {onDeploy && (
            <button
              type='button'
              onClick={onDeploy}
              disabled={isDeploying}
              className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-50'
            >
              <Rocket size={12} className={isDeploying ? 'animate-pulse' : ''} />
              <span>{isDeploying ? 'Deploying...' : 'Deploy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className='px-4 sm:px-6 flex items-center justify-between'>
        <nav className='flex items-center gap-1 sm:gap-2 text-xs font-mono uppercase tracking-wider overflow-x-auto'>
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`py-3 px-2 sm:px-3 border-b-2 transition-colors whitespace-nowrap font-medium ${
                  active
                    ? 'border-white text-white font-bold'
                    : 'border-transparent text-kr0n-text-secondary hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className='hidden lg:flex items-center gap-3 text-[11px] font-mono text-kr0n-text-secondary'>
          <div className='flex items-center gap-1.5'>
            <span
              className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            <span className={isHealthy ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isHealthy ? '100% Passing' : 'Warning'}
            </span>
          </div>
          <span className='text-kr0n-line-strong'>|</span>
          <span>{service?.repository?.split('/').pop() || 'repo'}</span>
          <span className='text-kr0n-line-strong'>|</span>
          <span className='text-white font-bold'>{service?.branch || 'main'}</span>
        </div>
      </div>
    </div>
  );
}
