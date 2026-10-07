'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { MOCK_CAPACITY } from '@/lib/observability-data';

function HeadroomBar({ available, total, unit }) {
  const usedPercent = ((total - available) / total) * 100;
  const availPercent = (available / total) * 100;
  const isLow = availPercent < 20;
  const isWarning = availPercent < 35;

  return (
    <div className='space-y-2'>
      <div className='w-full h-2 bg-kr0n-surface-3 overflow-hidden flex'>
        {/* Used portion */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usedPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className='h-full bg-white/30'
        />
        {/* Available portion */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${availPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          className={`h-full ${
            isLow ? 'bg-red-400/80' : isWarning ? 'bg-amber-400/60' : 'bg-emerald-400/50'
          }`}
        />
      </div>
      <div className='flex items-center justify-between text-[11px] font-mono text-kr0n-muted'>
        <span><span className='text-kr0n-text-secondary font-medium'>{(total - available).toFixed(1)} {unit}</span> used</span>
        <span><span className='text-kr0n-text-secondary font-medium'>{available} {unit}</span> available of <span className='text-kr0n-text-secondary'>{total} {unit}</span></span>
      </div>
    </div>
  );
}

export default function CapacityPage() {
  return (
    <div className='flex-1 overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Capacity Header ─── */}
      <div className='px-6 sm:px-8 py-8 border-b border-kr0n-line-soft'>
        <div className='max-w-3xl'>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className='text-2xl font-bold text-white tracking-wide'>
              Capacity
            </h1>
            <p className='text-sm text-kr0n-text-secondary mt-2'>
              Your available deployment and resource headroom.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Warnings ─── */}
      {MOCK_CAPACITY.warnings.length > 0 && (
        <div className='px-6 sm:px-8 pt-6'>
          {MOCK_CAPACITY.warnings.map((warning, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className='max-w-3xl border border-amber-400/30 bg-amber-400/[0.04] px-5 py-3 mb-3'
            >
              <div className='flex items-center gap-2 text-xs'>
                <AlertTriangle size={14} className='text-amber-400 shrink-0' />
                <span className='text-kr0n-text font-medium'>{warning}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Headroom Visualization ─── */}
      <div className='px-6 sm:px-8 py-8'>
        <div className='max-w-3xl space-y-10'>
          {/* Summary line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className='border-b border-kr0n-line-soft pb-6'
          >
            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-semibold mb-4'>
              Resource Headroom
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
              {MOCK_CAPACITY.resources.map((r, i) => {
                const availPercent = (r.available / r.total) * 100;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                  >
                    <div className='text-2xl font-bold text-white tabular-nums'>
                      {r.available}
                    </div>
                    <div className='text-[10px] font-mono text-kr0n-muted mt-0.5 font-medium'>
                      {r.unit} available
                    </div>
                    <div className={`text-[11px] font-mono mt-1 font-semibold ${
                      availPercent < 20 ? 'text-red-400' : availPercent < 35 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {availPercent.toFixed(0)}% free
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Individual resource detail */}
          {MOCK_CAPACITY.resources.map((resource, i) => {
            const availPercent = (resource.available / resource.total) * 100;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-semibold'>
                    {resource.label}
                  </div>
                  <div className='flex items-center gap-2 text-xs font-mono'>
                    <span className='text-white font-bold tabular-nums'>
                      {resource.available} {resource.unit}
                    </span>
                    <span className='text-kr0n-muted font-medium'>available</span>
                  </div>
                </div>

                <HeadroomBar
                  available={resource.available}
                  total={resource.total}
                  unit={resource.unit}
                />
              </motion.div>
            );
          })}

          {/* ─── Largest Consumers ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className='pt-4 border-t border-kr0n-line-soft'
          >
            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-semibold mb-5'>
              Largest Consumers
            </div>

            <div className='space-y-3'>
              {MOCK_CAPACITY.consumers.map((consumer, i) => (
                <div key={consumer.name} className='flex items-center gap-4'>
                  <span className='text-xs font-mono text-kr0n-text w-24 shrink-0 font-medium'>
                    {consumer.name}
                  </span>
                  <div className='flex-1 h-[5px] bg-kr0n-surface-3 overflow-hidden max-w-sm'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${consumer.percentage}%` }}
                      transition={{ duration: 0.7, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
                      className='h-full bg-white/40'
                    />
                  </div>
                  <span className='text-xs font-mono text-kr0n-text-secondary tabular-nums w-10 text-right font-medium'>
                    {consumer.percentage}%
                  </span>
                  <span className='text-[11px] font-mono text-kr0n-muted w-24 text-right'>
                    {consumer.services} services
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Actions ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className='pt-4 flex items-center gap-6'
          >
            <Link
              href='/usage'
              className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wider font-medium'
            >
              View detailed usage <ArrowRight size={11} />
            </Link>
            <Link
              href='/billing'
              className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wider font-medium'
            >
              Manage plan <ArrowRight size={11} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
