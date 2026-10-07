'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { MOCK_USAGE, MOCK_QUOTA_WARNING } from '@/lib/observability-data';

function UsageBar({ used, quota, unit, pressure }) {
  const percentage = Math.min((used / quota) * 100, 100);
  const isHigh = percentage > 85;
  const isWarning = percentage > 70;

  return (
    <div className='space-y-2'>
      <div className='w-full h-[6px] bg-kr0n-black overflow-hidden'>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${
            isHigh ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-white/80'
          }`}
        />
      </div>
      <div className='flex items-center justify-between text-[10px] font-mono'>
        <span className='text-kr0n-text-secondary font-medium'>
          {used} / {quota} {unit}
        </span>
        <span className={`font-bold tabular-nums ${
          isHigh ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [expandedResource, setExpandedResource] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const toggleExpand = (id) => {
    setExpandedResource(expandedResource === id ? null : id);
  };

  return (
    <div className='flex-1 overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Usage Header ─── */}
      <div className='px-6 sm:px-8 py-8 border-b border-kr0n-line-soft'>
        <div className='max-w-3xl'>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className='text-2xl font-bold text-white tracking-wide'>
              Usage
            </h1>
            <div className='flex items-center gap-4 mt-3'>
              <span className='text-sm text-kr0n-text-secondary font-medium'>
                {MOCK_USAGE.period}
              </span>
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className='flex items-center gap-1.5 px-2.5 py-1 border border-kr0n-line text-[11px] font-mono text-kr0n-text-secondary hover:text-white hover:border-kr0n-line-strong transition-colors font-medium'
                >
                  <span>This month</span>
                  <ChevronDown size={10} />
                </button>
                {showPeriodDropdown && (
                  <div className='absolute top-full left-0 mt-1 z-20 bg-kr0n-surface border border-kr0n-line min-w-[140px] py-1 shadow-xl'>
                    {['This month', 'Last month', 'Last 3 months'].map((p) => (
                      <button
                        key={p}
                        type='button'
                        onClick={() => { setSelectedPeriod(p); setShowPeriodDropdown(false); }}
                        className='w-full text-left px-3 py-1.5 text-[11px] font-mono text-kr0n-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors font-medium'
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Quota Warning (if active) ─── */}
      {MOCK_QUOTA_WARNING.active && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='mx-6 sm:mx-8 mt-6 border border-amber-400/30 bg-amber-400/[0.04] px-5 py-4'
        >
          <div className='flex items-start gap-3'>
            <AlertTriangle size={16} className='text-amber-400 shrink-0 mt-0.5' />
            <div className='space-y-2'>
              <div className='text-xs font-mono text-amber-400 font-bold uppercase tracking-wider'>
                Deployment Blocked
              </div>
              <p className='text-sm text-kr0n-text-secondary font-medium'>
                {MOCK_QUOTA_WARNING.message}
              </p>
              <div className='flex items-center gap-4 text-xs font-mono text-kr0n-text-secondary'>
                <span>Current: <strong className='text-white'>{MOCK_QUOTA_WARNING.current}</strong></span>
                <span className='text-kr0n-muted'>·</span>
                <span>Limit: <strong className='text-white'>{MOCK_QUOTA_WARNING.limit}</strong></span>
                <span className='text-kr0n-muted'>·</span>
                <span>Required: <strong className='text-amber-400'>{MOCK_QUOTA_WARNING.required}</strong></span>
              </div>
              <div className='flex items-center gap-3 mt-2'>
                <Link
                  href='/usage'
                  className='text-[11px] font-mono text-white hover:text-kr0n-text-secondary transition-colors flex items-center gap-1 font-bold'
                >
                  Review Usage <ArrowRight size={10} />
                </Link>
                <Link
                  href='/billing'
                  className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1 font-medium'
                >
                  Manage Plan <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Resource Ledger ─── */}
      <div className='px-6 sm:px-8 py-8' onClick={() => setShowPeriodDropdown(false)}>
        <div className='max-w-3xl space-y-0'>
          {MOCK_USAGE.resources.map((resource, i) => {
            const isExpanded = expandedResource === resource.id;
            const percentage = Math.min((resource.used / resource.quota) * 100, 100);
            const prevChange = resource.used - resource.previousPeriod;
            const prevChangePercent = ((prevChange / resource.previousPeriod) * 100).toFixed(0);

            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className='border-b border-kr0n-line-soft'
              >
                {/* Resource row */}
                <button
                  type='button'
                  onClick={() => toggleExpand(resource.id)}
                  className='w-full text-left py-6 group hover:bg-white/[0.015] transition-colors'
                  aria-expanded={isExpanded}
                >
                  <div className='flex items-start justify-between gap-6'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <ChevronRight
                          size={12}
                          className={`text-kr0n-muted group-hover:text-white transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                        <span className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-widest font-bold'>
                          {resource.label}
                        </span>
                      </div>

                      <div className='flex items-baseline gap-3 mt-2 ml-5'>
                        <span className='text-xl font-bold text-white tabular-nums'>
                          {resource.used}
                        </span>
                        <span className='text-sm text-kr0n-muted font-medium'>
                          / {resource.quota} {resource.unit}
                        </span>
                      </div>

                      <div className='ml-5 mt-3 max-w-lg'>
                        <UsageBar
                          used={resource.used}
                          quota={resource.quota}
                          unit={resource.unit}
                        />
                      </div>
                    </div>

                    <div className='text-right shrink-0'>
                      <div className={`text-lg font-bold tabular-nums ${
                        percentage > 85 ? 'text-red-400' : percentage > 70 ? 'text-amber-400' : 'text-white'
                      }`}>
                        {percentage.toFixed(0)}%
                      </div>
                      <div className='flex items-center gap-1 text-[10px] font-mono text-kr0n-muted mt-1 justify-end font-medium'>
                        <TrendingUp size={9} className={prevChange > 0 ? 'text-kr0n-muted' : 'text-emerald-400'} />
                        <span>{prevChange > 0 ? '+' : ''}{prevChangePercent}% vs last period</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className='overflow-hidden'
                    >
                      <div className='pb-6 pl-5 pr-0'>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5'>
                          <div>
                            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-bold'>
                              Current
                            </div>
                            <div className='text-sm font-bold text-white mt-1 tabular-nums'>
                              {resource.used} {resource.unit}
                            </div>
                          </div>
                          <div>
                            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-bold'>
                              Remaining
                            </div>
                            <div className='text-sm font-bold text-kr0n-text-secondary mt-1 tabular-nums'>
                              {(resource.quota - resource.used).toFixed(1)} {resource.unit}
                            </div>
                          </div>
                          <div>
                            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-bold'>
                              Previous Period
                            </div>
                            <div className='text-sm font-bold text-kr0n-text-secondary mt-1 tabular-nums'>
                              {resource.previousPeriod} {resource.unit}
                            </div>
                          </div>
                        </div>

                        {/* Project breakdown */}
                        <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider mb-3 font-bold'>
                          By Project
                        </div>
                        <div className='space-y-2'>
                          {resource.projects.map((proj) => {
                            const projPercent = (proj.usage / resource.used) * 100;
                            return (
                              <div key={proj.name} className='flex items-center gap-3'>
                                <span className='text-xs font-mono text-white w-20 shrink-0 font-medium'>
                                  {proj.name}
                                </span>
                                <div className='flex-1 h-[3px] bg-kr0n-black overflow-hidden max-w-xs'>
                                  <div
                                    className='h-full bg-white/60'
                                    style={{ width: `${projPercent}%` }}
                                  />
                                </div>
                                <span className='text-[10px] font-mono text-kr0n-text-secondary tabular-nums w-16 text-right font-medium'>
                                  {proj.usage} {resource.unit}
                                </span>
                                <span className='text-[10px] font-mono text-kr0n-muted tabular-nums w-10 text-right'>
                                  {projPercent.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Period Summary ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className='max-w-3xl mt-8 border border-kr0n-line-soft bg-kr0n-black/20 p-5'
        >
          <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-widest mb-4 font-bold'>
            This Period Summary
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-5 gap-6 font-mono'>
            {MOCK_USAGE.resources.map((r) => (
              <div key={r.id}>
                <div className='text-base font-bold text-white tabular-nums'>
                  {r.used}
                </div>
                <div className='text-[10px] text-kr0n-muted mt-0.5 font-medium'>
                  {r.unit === 'minutes' ? 'build min' : r.unit}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
