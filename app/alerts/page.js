'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Search,
  Filter,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';

export default function AlertsInboxPage() {
  const { alerts, acknowledgeAlert, resolveAlert } = useKr0nStore();

  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'firing' | 'acknowledged' | 'resolved'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.projectName.toLowerCase().includes(q) ||
        alert.serviceName.toLowerCase().includes(q) ||
        alert.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const firingCount = alerts.filter((a) => a.status === 'firing').length;
  const ackCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Header ─── */}
      <div className='px-4 sm:px-6 lg:px-8 py-6 border-b border-kr0n-line bg-kr0n-black/40 shrink-0'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 border border-kr0n-line bg-kr0n-surface flex items-center justify-center text-white'>
                <Bell size={16} />
              </div>
              <h1 className='text-xl sm:text-2xl font-bold font-mono text-white tracking-wide uppercase'>
                Alerts Inbox
              </h1>
              {firingCount > 0 && (
                <span className='px-2 py-0.5 bg-red-400/10 border border-red-400/30 text-red-400 text-xs font-mono font-bold uppercase'>
                  {firingCount} Firing
                </span>
              )}
            </div>
            <p className='text-xs font-mono text-kr0n-text-secondary'>
              Centralized operational telemetry conditions, probe anomalies, and quota thresholds.
            </p>
          </div>

          {/* Status Quick Filter Badges */}
          <div className='flex items-center gap-2 font-mono text-xs'>
            <button
              type='button'
              onClick={() => setStatusFilter('firing')}
              className={`px-3 py-1.5 border transition-colors flex items-center gap-1.5 ${
                statusFilter === 'firing'
                  ? 'border-red-400 bg-red-400/10 text-red-400 font-bold'
                  : 'border-kr0n-line text-kr0n-text-secondary hover:text-white'
              }`}
            >
              <span className='w-1.5 h-1.5 rounded-full bg-red-400' />
              <span>Firing ({firingCount})</span>
            </button>
            <button
              type='button'
              onClick={() => setStatusFilter('acknowledged')}
              className={`px-3 py-1.5 border transition-colors flex items-center gap-1.5 ${
                statusFilter === 'acknowledged'
                  ? 'border-amber-400 bg-amber-400/10 text-amber-400 font-bold'
                  : 'border-kr0n-line text-kr0n-text-secondary hover:text-white'
              }`}
            >
              <span className='w-1.5 h-1.5 rounded-full bg-amber-400' />
              <span>Ack ({ackCount})</span>
            </button>
            <button
              type='button'
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 border transition-colors flex items-center gap-1.5 ${
                statusFilter === 'resolved'
                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400 font-bold'
                  : 'border-kr0n-line text-kr0n-text-secondary hover:text-white'
              }`}
            >
              <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
              <span>Resolved ({resolvedCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6'>
        {/* ─── Toolbar ─── */}
        <div className='p-3 border border-kr0n-line bg-kr0n-surface flex flex-wrap items-center gap-3'>
          <div className='relative flex-1 min-w-[200px]'>
            <Search size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-kr0n-muted' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search alerts by title, service, project, source...'
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

          <div className='flex items-center gap-1 text-xs font-mono'>
            <span className='text-[10px] text-kr0n-muted uppercase font-bold mr-1'>Severity:</span>
            {['all', 'critical', 'warning', 'info'].map((sev) => (
              <button
                key={sev}
                type='button'
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 border text-[11px] uppercase tracking-wider font-medium transition-colors ${
                  severityFilter === sev
                    ? 'border-white text-white bg-white/10 font-bold'
                    : 'border-kr0n-line text-kr0n-text-secondary hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {(statusFilter !== 'all' || severityFilter !== 'all' || searchQuery) && (
            <button
              type='button'
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setSearchQuery('');
              }}
              className='text-xs font-mono text-kr0n-text-secondary hover:text-white underline underline-offset-4'
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ─── Alerts List ─── */}
        <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft font-mono text-xs'>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const isFiring = alert.status === 'firing';
              const isAck = alert.status === 'acknowledged';
              const isResolved = alert.status === 'resolved';

              return (
                <div
                  key={alert.id}
                  className='p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors'
                >
                  <div className='flex items-start gap-4 min-w-0'>
                    <div
                      className={`w-7 h-7 border flex items-center justify-center shrink-0 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'border-red-400/40 bg-red-400/10 text-red-400'
                          : alert.severity === 'warning'
                          ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                          : 'border-blue-400/40 bg-blue-400/10 text-blue-400'
                      }`}
                    >
                      {alert.severity === 'critical' ? (
                        <AlertTriangle size={14} />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <Info size={14} />
                      )}
                    </div>

                    <div className='space-y-1 min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-bold text-white font-mono'>
                          {alert.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            isFiring
                              ? 'bg-red-400/10 text-red-400 border border-red-400/30'
                              : isAck
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                              : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                          }`}
                        >
                          {alert.status}
                        </span>
                        <span className='px-1.5 py-0.2 bg-white/5 border border-kr0n-line text-[10px] text-kr0n-text-secondary uppercase'>
                          {alert.severity}
                        </span>
                      </div>

                      <p className='text-xs text-kr0n-text-secondary font-sans leading-relaxed'>
                        {alert.description}
                      </p>

                      <div className='text-[10px] text-kr0n-muted flex flex-wrap items-center gap-2 pt-0.5'>
                        <span>
                          Project: <strong className='text-white'>{alert.projectName}</strong>
                        </span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>
                          Service:{' '}
                          <Link
                            href={`/projects/${alert.projectId}/services/${alert.serviceId}`}
                            className='text-white hover:underline'
                          >
                            {alert.serviceName}
                          </Link>
                        </span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>Source: <span className='text-kr0n-text-secondary'>{alert.source}</span></span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>{alert.triggeredAt}</span>

                        {alert.incidentId && (
                          <>
                            <span className='text-kr0n-line-strong'>|</span>
                            <Link
                              href={`/incidents/${alert.incidentId}`}
                              className='text-red-400 hover:underline font-bold flex items-center gap-1'
                            >
                              <span>Incident: {alert.incidentId}</span>
                              <ExternalLink size={9} />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex items-center gap-2 shrink-0 self-end md:self-center'>
                    {isFiring && (
                      <button
                        type='button'
                        onClick={() => acknowledgeAlert(alert.id)}
                        className='px-3 py-1.5 border border-kr0n-line hover:border-amber-400/40 text-[11px] text-kr0n-text-secondary hover:text-amber-400 transition-colors font-medium'
                      >
                        Acknowledge
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        type='button'
                        onClick={() => resolveAlert(alert.id)}
                        className='px-3 py-1.5 border border-kr0n-line hover:border-emerald-400/40 text-[11px] text-kr0n-text-secondary hover:text-emerald-400 transition-colors font-medium flex items-center gap-1'
                      >
                        <Check size={12} />
                        <span>Resolve</span>
                      </button>
                    )}

                    <Link
                      href={`/projects/${alert.projectId}/services/${alert.serviceId}`}
                      className='px-3 py-1.5 border border-kr0n-line text-[11px] text-kr0n-text-secondary hover:text-white transition-colors'
                    >
                      Service →
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            /* Quiet State */
            <div className='p-12 text-center space-y-3 font-sans'>
              <div className='w-12 h-12 border border-kr0n-line bg-kr0n-black flex items-center justify-center mx-auto text-emerald-400'>
                <CheckCircle2 size={20} />
              </div>
              <h3 className='text-sm font-mono font-bold text-white uppercase'>All Quiet — No Matching Alerts</h3>
              <p className='text-xs text-kr0n-text-secondary max-w-sm mx-auto'>
                There are no firing alerts matching the selected filters. Global Anycast mesh and probe telemetry are healthy.
              </p>
              <button
                type='button'
                onClick={() => {
                  setStatusFilter('all');
                  setSeverityFilter('all');
                  setSearchQuery('');
                }}
                className='text-xs font-mono text-white underline underline-offset-4'
              >
                Reset Filter View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
