'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Rocket,
  RotateCw,
  GitBranch,
  ShieldCheck,
  Activity,
  HardDrive,
  Globe,
  Terminal,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Copy,
  ChevronRight,
  RefreshCw,
  Server,
  Cpu,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import ServiceHeaderTabs from '@/components/services/ServiceHeaderTabs';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function ServiceOverviewPage({ params }) {
  const { projectId, serviceId } = use(params);
  const {
    projects,
    deployments,
    alerts,
    triggerDeploy,
    triggerRollback,
  } = useKr0nStore();

  const project = projects.find((p) => p.id === projectId);
  const service = project?.services?.find((s) => s.id === serviceId);

  const [isDeploying, setIsDeploying] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState(null);

  // Live log simulation for overview preview
  const [previewLogs, setPreviewLogs] = useState([
    { id: 1, time: '14:28:10.104', level: 'INFO', msg: '[kr0n-edge] Routing initialized via Anycast PoP us-east-1' },
    { id: 2, time: '14:28:10.350', level: 'INFO', msg: '[healthcheck] Probe HTTP /health 200 OK (1.2ms)' },
    { id: 3, time: '14:28:12.880', level: 'INFO', msg: '[upstream] Connection pool ready (12 active, 0 queued)' },
    { id: 4, time: '14:28:15.210', level: 'INFO', msg: '[traffic] GET /api/v1/inventory status=200 latency=4.8ms' },
  ]);

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

  const serviceDeployments = deployments[serviceId] || deployments.svc_api || [];
  const activeDeployment = serviceDeployments.find((d) => d.status === 'active') || serviceDeployments[0];
  const recentDeployments = serviceDeployments.slice(0, 3);
  const relatedAlerts = alerts.filter(
    (a) => a.projectId === projectId && a.serviceId === serviceId && a.status === 'firing'
  );

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      triggerDeploy(serviceId, 'Manual deploy from service overview');
      setIsDeploying(false);
    }, 1800);
  };

  const handleRestart = () => {
    setIsRestarting(true);
    setTimeout(() => {
      setIsRestarting(false);
    }, 1400);
  };

  const confirmRollback = () => {
    if (rollbackTarget) {
      triggerRollback(serviceId, rollbackTarget.id);
      setShowRollbackModal(false);
      setRollbackTarget(null);
    }
  };

  const isHealthy = service.healthCheck?.status === 'healthy' || service.healthCheck?.status !== 'warning';

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      <ServiceHeaderTabs
        project={project}
        service={service}
        onDeploy={handleDeploy}
        onRestart={handleRestart}
        isDeploying={isDeploying}
        isRestarting={isRestarting}
      />

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6'>
        {/* Unhealthy / Firing Alerts Banner */}
        {relatedAlerts.length > 0 && (
          <div className='border border-amber-400/30 bg-amber-400/[0.04] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-start gap-3'>
              <AlertTriangle size={16} className='text-amber-400 shrink-0 mt-0.5' />
              <div>
                <div className='text-xs font-mono font-bold text-amber-400 uppercase tracking-wider'>
                  Active Service Alert · {relatedAlerts.length} Firing
                </div>
                <p className='text-xs text-kr0n-text-secondary mt-0.5'>
                  {relatedAlerts[0].title}
                </p>
              </div>
            </div>
            <Link
              href='/alerts'
              className='text-xs font-mono text-white hover:underline flex items-center gap-1 font-bold shrink-0'
            >
              <span>View Alert Inbox</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        )}

        {/* ─── Service Identity & Quick Stats ─── */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Active Release Card */}
          <div className='md:col-span-2 border border-kr0n-line bg-kr0n-surface p-5 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-widest font-bold'>
                Active Release
              </div>
              <span className='px-2 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-mono font-bold uppercase'>
                {activeDeployment?.status || 'Active'}
              </span>
            </div>

            <div>
              <div className='flex items-baseline gap-2.5'>
                <span className='text-2xl font-bold font-mono text-white'>
                  {activeDeployment?.version || 'v1.0.0'}
                </span>
                <span className='text-xs font-mono text-kr0n-text-secondary'>
                  ({activeDeployment?.commit || 'commit'})
                </span>
              </div>
              <p className='text-xs text-kr0n-text-secondary mt-1 font-sans line-clamp-1'>
                {activeDeployment?.commitMsg || 'Latest production build'}
              </p>
            </div>

            <div className='pt-2 border-t border-kr0n-line-soft flex items-center justify-between text-xs font-mono text-kr0n-text-secondary'>
              <div className='flex items-center gap-1.5'>
                <GitBranch size={12} className='text-kr0n-muted' />
                <span>{service.branch || 'main'}</span>
                <span className='text-kr0n-muted'>·</span>
                <span>{activeDeployment?.timestamp || 'recently'}</span>
              </div>
              <Link
                href={`/projects/${projectId}/services/${serviceId}/deployments/${activeDeployment?.id || 'dep_a83f2c1'}`}
                className='text-white hover:text-kr0n-text-secondary transition-colors font-medium flex items-center gap-1'
              >
                <span>Details</span>
                <ChevronRight size={11} />
              </Link>
            </div>
          </div>

          {/* Health & Uptime Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3'>
            <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-widest font-bold'>
              Health Check
            </div>
            <div className='space-y-1'>
              <div className='text-xl font-bold font-mono text-emerald-400 flex items-center gap-2'>
                <CheckCircle2 size={16} />
                <span>{service.healthCheck?.passingPercent || '100%'}</span>
              </div>
              <div className='text-xs font-mono text-kr0n-text-secondary'>
                {service.healthCheck?.path || '/health'}
              </div>
            </div>
            <div className='text-[11px] font-mono text-kr0n-text-secondary pt-2 border-t border-kr0n-line-soft'>
              Interval: {service.healthCheck?.interval || 10}s · Timeout: {service.healthCheck?.timeout || 5}s
            </div>
          </div>

          {/* Resource Allocation Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3'>
            <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-widest font-bold'>
              Compute & Scale
            </div>
            <div className='space-y-1 font-mono'>
              <div className='text-xl font-bold text-white'>
                {service.resources?.instances || 3} Instances
              </div>
              <div className='text-xs text-kr0n-text-secondary'>
                {service.resources?.cpu || '0.5 vCPU'} · {service.resources?.memory || '1.8 GB'}
              </div>
            </div>
            <div className='text-[11px] font-mono text-kr0n-text-secondary pt-2 border-t border-kr0n-line-soft flex items-center justify-between'>
              <span>Autoscale</span>
              <span className='text-white font-bold'>{service.resources?.minInstances || 1}–{service.resources?.maxInstances || 6} inst</span>
            </div>
          </div>
        </div>

        {/* ─── Networking & Storage Row ─── */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Networking & Domains Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Globe size={14} className='text-kr0n-muted' />
                <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-text-secondary font-bold'>
                  Networking & Ingress
                </h2>
              </div>
              <Link
                href={`/projects/${projectId}/services/${serviceId}/settings#networking`}
                className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors'
              >
                Configure →
              </Link>
            </div>

            <div className='space-y-2.5 font-mono text-xs'>
              {/* Platform URL */}
              {service.url ? (
                <div className='p-3 border border-kr0n-line-soft bg-kr0n-black flex items-center justify-between'>
                  <div className='min-w-0'>
                    <div className='text-[10px] text-kr0n-muted uppercase font-bold'>Platform Subdomain</div>
                    <a
                      href={`https://${service.url}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-white hover:underline truncate block font-bold'
                    >
                      https://{service.url}
                    </a>
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${service.url}`);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className='p-1.5 text-kr0n-muted hover:text-white transition-colors'
                    title='Copy URL'
                  >
                    <Copy size={13} />
                  </button>
                </div>
              ) : null}

              {/* Custom domains */}
              {service.customDomains && service.customDomains.length > 0 ? (
                service.customDomains.map((cd, i) => (
                  <div key={i} className='p-3 border border-kr0n-line-soft bg-kr0n-black flex items-center justify-between'>
                    <div>
                      <div className='text-[10px] text-kr0n-muted uppercase font-bold'>Custom Domain</div>
                      <div className='text-white font-bold'>{cd.domain}</div>
                    </div>
                    <div className='text-right'>
                      <span className='px-1.5 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold'>
                        TLS ACTIVE
                      </span>
                      <div className='text-[10px] text-kr0n-muted mt-0.5'>{cd.renewal}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-xs text-kr0n-text-secondary py-2'>
                  No custom domain attached. Default Anycast edge routing active on port {service.port || 8080}.
                </div>
              )}
            </div>
          </div>

          {/* Persistent Volumes Card */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <HardDrive size={14} className='text-kr0n-muted' />
                <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-text-secondary font-bold'>
                  Storage & Volumes
                </h2>
              </div>
              <Link
                href={`/projects/${projectId}/services/${serviceId}/settings#storage`}
                className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors'
              >
                Manage →
              </Link>
            </div>

            <div className='space-y-2.5 font-mono text-xs'>
              {service.volumes && service.volumes.length > 0 ? (
                service.volumes.map((vol) => (
                  <div key={vol.id} className='p-3 border border-kr0n-line-soft bg-kr0n-black flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <div className='text-white font-bold'>{vol.name}</div>
                      <div className='text-[10px] text-kr0n-text-secondary'>
                        Mount: <span className='text-white'>{vol.mountPath}</span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <span className='text-white font-bold'>{vol.size}</span>
                      <div className='text-[10px] text-emerald-400 uppercase font-bold'>ATTACHED</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='p-6 text-center text-kr0n-text-secondary border border-dashed border-kr0n-line'>
                  <p className='text-xs font-mono'>No persistent volumes attached to this service.</p>
                  <p className='text-[11px] text-kr0n-muted mt-1'>
                    Workload is stateless. Attach storage in service settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Recent Deployments Table ─── */}
        <div className='space-y-3 font-mono'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Recent Deployments
            </h2>
            <Link
              href={`/projects/${projectId}/services/${serviceId}/deployments`}
              className='text-[11px] text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1 font-bold'
            >
              <span>View all ({serviceDeployments.length})</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft text-xs'>
            {recentDeployments.map((dep, idx) => (
              <div
                key={dep.id}
                className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.015] transition-colors'
              >
                <div className='flex items-start gap-3 min-w-0'>
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      dep.status === 'active'
                        ? 'bg-emerald-400'
                        : dep.status === 'failed' || dep.status === 'rejected'
                        ? 'bg-red-400'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/projects/${projectId}/services/${serviceId}/deployments/${dep.id}`}
                        className='text-white font-bold hover:underline'
                      >
                        {dep.version}
                      </Link>
                      <span className='text-kr0n-muted'>·</span>
                      <span className='text-kr0n-text-secondary'>{dep.commit}</span>
                      {dep.status === 'active' && (
                        <span className='px-1.5 py-0.2 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                          Active
                        </span>
                      )}
                      {dep.status === 'rejected' && (
                        <span className='px-1.5 py-0.2 bg-red-400/10 text-red-400 text-[10px] font-bold uppercase'>
                          Quota Rejected
                        </span>
                      )}
                    </div>
                    <p className='text-kr0n-text-secondary truncate mt-0.5'>{dep.commitMsg}</p>
                    <div className='text-[10px] text-kr0n-muted mt-0.5'>
                      by {dep.author} · {dep.branch} · {dep.timestamp}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2 shrink-0 self-end sm:self-center'>
                  <Link
                    href={`/projects/${projectId}/services/${serviceId}/deployments/${dep.id}`}
                    className='px-2.5 py-1 border border-kr0n-line text-[11px] text-kr0n-text-secondary hover:text-white transition-colors font-medium'
                  >
                    Inspect
                  </Link>
                  {dep.status !== 'active' && dep.status !== 'failed' && dep.status !== 'rejected' && (
                    <button
                      type='button'
                      onClick={() => {
                        setRollbackTarget(dep);
                        setShowRollbackModal(true);
                      }}
                      className='px-2.5 py-1 border border-kr0n-line text-[11px] text-kr0n-text-secondary hover:text-amber-400 hover:border-amber-400/40 transition-colors font-medium'
                    >
                      Rollback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Live Log Preview ─── */}
        <div className='space-y-3 font-mono'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Terminal size={14} className='text-kr0n-muted' />
              <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
                Runtime Output Preview
              </h2>
            </div>
            <Link
              href={`/projects/${projectId}/services/${serviceId}/logs`}
              className='text-[11px] text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1 font-bold'
            >
              <span>Full terminal →</span>
            </Link>
          </div>

          <div className='border border-kr0n-line bg-kr0n-black p-4 font-mono text-xs leading-relaxed space-y-1 overflow-x-auto select-text'>
            {previewLogs.map((log) => (
              <div key={log.id} className='flex items-start gap-3'>
                <span className='text-kr0n-muted shrink-0 tabular-nums select-none'>{log.time}</span>
                <span className='text-emerald-400 font-bold shrink-0'>[{log.level}]</span>
                <span className='text-kr0n-text-secondary'>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Rollback Confirmation Modal ─── */}
      {showRollbackModal && rollbackTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-5 font-mono text-xs'>
            <div className='space-y-1.5'>
              <h3 className='text-sm font-bold text-white uppercase'>Confirm Release Rollback</h3>
              <p className='text-kr0n-text-secondary font-sans leading-relaxed'>
                Are you sure you want to rollback to release <strong className='text-white'>{rollbackTarget.version}</strong> ({rollbackTarget.commit})?
                This will create a new deployment reconciling desired state to this prior snapshot.
              </p>
            </div>

            <div className='p-3 border border-kr0n-line bg-kr0n-black space-y-1 text-[11px]'>
              <div className='text-white font-bold'>{rollbackTarget.commitMsg}</div>
              <div className='text-kr0n-muted'>Authored by {rollbackTarget.author} on branch {rollbackTarget.branch}</div>
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
                onClick={confirmRollback}
                className='clipped-btn bg-amber-400 hover:bg-amber-300 text-black px-4 py-1.5 font-bold uppercase tracking-wider'
              >
                Execute Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
