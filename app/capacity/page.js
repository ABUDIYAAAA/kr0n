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
          className='h-full bg-white/20'
        />
        {/* Available portion */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${availPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          className={`h-full ${
            isLow ? 'bg-red-400/60' : isWarning ? 'bg-amber-400/40' : 'bg-emerald-400/30'
          }`}
        />
      </div>
      <div className='flex items-center justify-between text-[10px] font-mono text-kr0n-faint'>
        <span>{(total - available).toFixed(1)} {unit} used</span>
        <span>{available} {unit} available of {total} {unit}</span>
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
            <p className='text-sm text-kr0n-muted mt-2'>
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
              className='max-w-3xl border border-amber-400/20 bg-amber-400/[0.03] px-5 py-3 mb-3'
            >
              <div className='flex items-center gap-2 text-xs'>
                <AlertTriangle size={13} className='text-amber-400' />
                <span className='text-kr0n-text-secondary'>{warning}</span>
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
            <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest mb-4'>
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
                    <div className='text-[10px] font-mono text-kr0n-faint mt-0.5'>
                      {r.unit} available
                    </div>
                    <div className={`text-[10px] font-mono mt-1 ${
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
                  <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest'>
                    {resource.label}
                  </div>
                  <div className='flex items-center gap-2 text-xs font-mono'>
                    <span className='text-white font-bold tabular-nums'>
                      {resource.available} {resource.unit}
                    </span>
                    <span className='text-kr0n-faint'>available</span>
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
            <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest mb-5'>
              Largest Consumers
            </div>

            <div className='space-y-3'>
              {MOCK_CAPACITY.consumers.map((consumer, i) => (
                <div key={consumer.name} className='flex items-center gap-4'>
                  <span className='text-xs font-mono text-kr0n-text-secondary w-24 shrink-0 font-medium'>
                    {consumer.name}
                  </span>
                  <div className='flex-1 h-[4px] bg-kr0n-black overflow-hidden max-w-sm'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${consumer.percentage}%` }}
                      transition={{ duration: 0.7, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
                      className='h-full bg-white/30'
                    />
                  </div>
                  <span className='text-xs font-mono text-kr0n-faint tabular-nums w-10 text-right'>
                    {consumer.percentage}%
                  </span>
                  <span className='text-[10px] font-mono text-kr0n-faint w-20 text-right'>
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
            className='pt-4 flex items-center gap-4'
          >
            <Link
              href='/usage'
              className='text-[11px] font-mono text-kr0n-muted hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider'
            >
              View detailed usage <ArrowRight size={10} />
            </Link>
            <Link
              href='/billing'
              className='text-[11px] font-mono text-kr0n-muted hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider'
            >
              Manage plan <ArrowRight size={10} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
