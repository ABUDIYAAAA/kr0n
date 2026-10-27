'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Activity,
  Terminal,
  GitBranch,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function IncidentDetailPage({ params }) {
  const { incidentId } = use(params);
  const {
    incidents,
    alerts,
    updateIncidentStatus,
  } = useKr0nStore();

  const incident = incidents.find((inc) => inc.id === incidentId);

  const [selectedStatus, setSelectedStatus] = useState(incident?.status || 'investigating');

  if (!incident) {
    return (
      <BrandedNotFound
        type='Incident'
        id={incidentId}
        backHref='/alerts'
        backLabel='Back to Alerts Inbox'
      />
    );
  }

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    updateIncidentStatus(incident.id, newStatus);
  };

  const relatedAlertObjects = alerts.filter((a) => incident.relatedAlertIds?.includes(a.id));
  const isResolved = incident.status === 'resolved';

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Breadcrumb Bar ─── */}
      <div className='h-12 border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0'>
        <div className='flex items-center gap-2.5 text-xs font-mono'>
          <Link
            href='/alerts'
            className='flex items-center gap-1 text-kr0n-text-secondary hover:text-white transition-colors uppercase tracking-wider font-medium'
          >
            <ArrowLeft size={12} />
            <span>Alerts</span>
          </Link>
          <span className='text-kr0n-muted'>/</span>
          <span className='text-white font-bold uppercase tracking-wider'>{incident.id}</span>
        </div>

        <div className='flex items-center gap-2 font-mono text-xs'>
          <span className='text-kr0n-muted uppercase text-[10px] font-bold hidden sm:inline'>Status:</span>
          {['investigating', 'monitoring', 'resolved'].map((st) => (
            <button
              key={st}
              type='button'
              onClick={() => handleStatusChange(st)}
              className={`px-2.5 py-1 border text-[10px] uppercase font-bold tracking-wider transition-colors ${
                incident.status === st
                  ? st === 'resolved'
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                    : 'border-white bg-white text-black'
                  : 'border-kr0n-line text-kr0n-text-secondary hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8'>
        {/* ─── Incident Header Card ─── */}
        <div className='border border-kr0n-line bg-kr0n-surface p-6 space-y-5'>
          <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <span
                  className={`w-3 h-3 rounded-full ${
                    isResolved ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'
                  }`}
                />
                <h1 className='text-xl sm:text-2xl font-bold font-mono text-white uppercase tracking-wide'>
                  {incident.title}
                </h1>
              </div>

              <div className='flex flex-wrap items-center gap-2 font-mono text-xs'>
                <span
                  className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                    incident.severity === 'critical'
                      ? 'border-red-400/40 bg-red-400/10 text-red-400'
                      : 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                  }`}
                >
                  {incident.severityLabel || incident.severity}
                </span>
                <span className='px-2 py-0.5 border border-kr0n-line bg-kr0n-black text-[10px] text-white uppercase font-bold'>
                  {incident.status}
                </span>
                <span className='text-kr0n-muted'>·</span>
                <span className='text-kr0n-text-secondary'>Started {incident.startedAt}</span>
              </div>
            </div>

            {/* Quick Action */}
            {!isResolved ? (
              <button
                type='button'
                onClick={() => handleStatusChange('resolved')}
                className='clipped-btn inline-flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-black px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider shrink-0 transition-colors'
              >
                <Check size={13} />
                <span>Mark Resolved</span>
              </button>
            ) : (
              <button
                type='button'
                onClick={() => handleStatusChange('investigating')}
                className='inline-flex items-center gap-1.5 px-3 py-1.5 border border-kr0n-line text-xs font-mono text-kr0n-text-secondary hover:text-white transition-colors'
              >
                <RotateCcw size={12} />
                <span>Re-open Incident</span>
              </button>
            )}
          </div>

          {/* Impact Statement */}
          <div className='p-4 border border-kr0n-line-soft bg-kr0n-black space-y-1 font-mono text-xs'>
            <div className='text-kr0n-muted text-[10px] uppercase font-bold'>Observed Customer Impact</div>
            <p className='text-white font-sans text-xs leading-relaxed'>{incident.impact}</p>
          </div>
        </div>

        {/* ─── Affected Resources & Correlated Deployments ─── */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs'>
          {/* Affected Resources */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3'>
            <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Affected Workloads & Services
            </h2>
            <div className='space-y-2'>
              {incident.affectedServices?.map((svc) => (
                <div key={svc.id} className='p-3 border border-kr0n-line-soft bg-kr0n-black flex items-center justify-between'>
                  <div>
                    <span className='text-white font-bold block'>{svc.name}</span>
                    <span className='text-[10px] text-kr0n-muted'>{svc.runtime}</span>
                  </div>
                  <Link
                    href={`/projects/${incident.affectedProjects[0]?.id}/services/${svc.id}`}
                    className='text-white hover:underline text-[11px] font-bold flex items-center gap-1'
                  >
                    <span>Inspect</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Correlated Deployment & Causal Links */}
          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-3'>
            <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Deployment Correlation
            </h2>
            {incident.relatedDeploymentId ? (
              <div className='p-3 border border-kr0n-line-soft bg-kr0n-black flex items-center justify-between'>
                <div className='flex items-center gap-2.5'>
                  <GitBranch size={14} className='text-kr0n-muted' />
                  <div>
                    <span className='text-white font-bold block'>{incident.relatedDeploymentId}</span>
                    <span className='text-[10px] text-kr0n-text-secondary'>Promoted prior to latency elevation</span>
                  </div>
                </div>
                <Link
                  href={`/projects/${incident.affectedProjects[0]?.id}/services/${incident.affectedServices[0]?.id}/deployments/${incident.relatedDeploymentId}`}
                  className='text-white hover:underline text-[11px] font-bold flex items-center gap-1'
                >
                  <span>View Release</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            ) : (
              <div className='text-kr0n-text-secondary text-xs py-2'>
                No deployment correlation recorded. Condition triggered by upstream traffic pattern.
              </div>
            )}
          </div>
        </div>

        {/* ─── Diagnostic Links ─── */}
        <div className='p-4 border border-kr0n-line bg-kr0n-surface flex flex-wrap items-center justify-between gap-4 font-mono text-xs'>
          <div className='space-y-0.5'>
            <span className='text-white font-bold block'>Diagnostic Deep Links</span>
            <span className='text-[11px] text-kr0n-text-secondary'>
              Inspect live telemetry and error traces directly correlated with this event.
            </span>
          </div>

          <div className='flex items-center gap-3'>
            {incident.diagnosticLinks?.map((diag, i) => (
              <Link
                key={i}
                href={diag.href}
                className='px-3 py-1.5 border border-kr0n-line hover:border-white text-white transition-colors text-xs font-medium flex items-center gap-1.5'
              >
                <span>{diag.label}</span>
                <ArrowRight size={11} />
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Related Firing Alerts ─── */}
        <div className='space-y-3 font-mono text-xs'>
          <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
            Correlated Alerts ({relatedAlertObjects.length})
          </h2>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
            {relatedAlertObjects.map((alt) => (
              <div key={alt.id} className='p-4 flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3 min-w-0'>
                  <AlertTriangle size={14} className='text-amber-400 shrink-0' />
                  <div className='min-w-0'>
                    <span className='text-white font-bold block truncate'>{alt.title}</span>
                    <span className='text-[10px] text-kr0n-muted'>{alt.source} · {alt.triggeredAt}</span>
                  </div>
                </div>
                <Link
                  href='/alerts'
                  className='text-[11px] text-kr0n-text-secondary hover:text-white transition-colors shrink-0'
                >
                  View in Inbox →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Event Timeline ─── */}
        <div className='space-y-3 font-mono text-xs'>
          <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
            Chronological Known Events Timeline
          </h2>

          <div className='border border-kr0n-line bg-kr0n-surface p-5 space-y-6'>
            <div className='relative pl-6 space-y-6'>
              {/* Timeline connecting line */}
              <div className='absolute left-2.5 top-2 bottom-2 w-[1px] bg-kr0n-line-strong' />

              {incident.timeline?.map((item, idx) => (
                <div key={idx} className='relative space-y-1'>
                  <div className='absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full border border-kr0n-line bg-white' />
                  <div className='flex items-baseline gap-2'>
                    <span className='text-white font-bold'>{item.label}</span>
                    <span className='text-kr0n-muted text-[10px] tabular-nums'>({item.time})</span>
                  </div>
                  <p className='text-kr0n-text-secondary font-sans text-xs'>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
