'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Clock, ArrowRight, X } from 'lucide-react';
import {
  MOCK_STATUS,
  generateStatusHistory,
  STATUS_STATE_CONFIG,
} from '@/lib/observability-data';

export default function StatusPage() {
  const statusHistory = useMemo(() => generateStatusHistory(90), []);
  const [selectedDay, setSelectedDay] = useState(null);

  const overallConfig = STATUS_STATE_CONFIG[MOCK_STATUS.overall];

  // Get the last 90 days for the timeline
  const last90 = statusHistory;

  // Count incidents
  const incidentCount = last90.filter((d) => d.incident).length;

  return (
    <div className='flex-1 overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Status Hero ─── */}
      <div className='px-6 sm:px-8 py-12 border-b border-kr0n-line-soft text-center'>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='max-w-xl mx-auto'
        >
          {/* Pulse indicator */}
          <div className='flex justify-center mb-5'>
            <div className='relative'>
              <span className={`block w-3 h-3 rounded-full ${overallConfig.dot}`} />
              {MOCK_STATUS.overall === 'operational' && (
                <span className={`absolute inset-0 w-3 h-3 rounded-full ${overallConfig.dot} animate-ping opacity-40`} />
              )}
            </div>
          </div>

          <h1 className='text-2xl sm:text-3xl font-bold text-white tracking-wide'>
            All systems operational.
          </h1>
          <p className='text-sm text-kr0n-text-secondary mt-3'>
            Everything is running normally.
          </p>
          <div className='text-[10px] font-mono text-kr0n-muted mt-4 uppercase tracking-wider font-medium'>
            Last updated · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </motion.div>
      </div>

      <div className='px-6 sm:px-8 py-8'>
        <div className='max-w-3xl mx-auto space-y-10'>
          {/* ─── System Status List ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-semibold mb-4'>
              Systems
            </div>

            <div className='divide-y divide-kr0n-line-soft border-t border-b border-kr0n-line-soft'>
              {MOCK_STATUS.systems.map((system, i) => {
                const config = STATUS_STATE_CONFIG[system.status];
                return (
                  <motion.div
                    key={system.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 + i * 0.03 }}
                    className='flex items-center justify-between py-3.5 group'
                  >
                    <div className='flex items-center gap-3'>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      <span className='text-sm text-white font-medium'>{system.name}</span>
                    </div>
                    <div className='flex items-center gap-4 text-xs font-mono'>
                      <span className='text-kr0n-muted tabular-nums hidden sm:inline font-medium'>
                        {system.uptime} uptime
                      </span>
                      <span className={`font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ─── 90-Day Timeline ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-semibold'>
                90-Day History
              </div>
              <div className='text-[10px] font-mono text-kr0n-muted font-medium'>
                {incidentCount} incident{incidentCount !== 1 ? 's' : ''} in the last 90 days
              </div>
            </div>

            {/* Timeline bars */}
            <div className='flex gap-[2px] items-end h-8'>
              {last90.map((day, i) => {
                const config = STATUS_STATE_CONFIG[day.status];
                const isSelected = selectedDay === i;

                return (
                  <button
                    key={day.date}
                    type='button'
                    onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                    className={`flex-1 min-w-0 transition-all duration-150 relative group ${
                      isSelected ? 'h-8' : day.incident ? 'h-6' : 'h-8'
                    }`}
                    title={`${day.dateLabel} — ${config.label}`}
                    aria-label={`${day.dateLabel}: ${config.label}${day.incident ? ` — ${day.incident.title}` : ''}`}
                  >
                    <div
                      className={`w-full h-full rounded-[1px] transition-all duration-150 ${
                        config.bar
                      } ${
                        isSelected ? 'opacity-100' : day.incident ? 'opacity-95' : 'opacity-45 hover:opacity-75'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Timeline labels */}
            <div className='flex items-center justify-between mt-2 text-[10px] font-mono text-kr0n-muted font-medium'>
              <span>{last90[last90.length - 1]?.dateLabel}</span>
              <span>Today</span>
            </div>

            {/* Selected day detail */}
            <AnimatePresence>
              {selectedDay !== null && last90[selectedDay] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className='overflow-hidden'
                >
                  <div className='mt-4 border border-kr0n-line bg-kr0n-surface p-4'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='text-xs font-mono text-white font-medium'>
                          {last90[selectedDay].dateLabel}
                        </div>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STATE_CONFIG[last90[selectedDay].status].dot}`} />
                          <span className={`text-[11px] font-mono font-semibold ${STATUS_STATE_CONFIG[last90[selectedDay].status].color}`}>
                            {STATUS_STATE_CONFIG[last90[selectedDay].status].label}
                          </span>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => setSelectedDay(null)}
                        className='text-kr0n-muted hover:text-white transition-colors p-1'
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {last90[selectedDay].incident ? (
                      <div className='mt-3 space-y-2'>
                        <div className='text-sm text-white font-semibold'>
                          {last90[selectedDay].incident.title}
                        </div>
                        <p className='text-xs text-kr0n-text-secondary leading-relaxed'>
                          {last90[selectedDay].incident.description}
                        </p>
                        <div className='flex items-center gap-3 text-[10px] font-mono text-kr0n-muted'>
                          <span className='text-kr0n-text-secondary font-medium'>{last90[selectedDay].incident.system}</span>
                          <span className='text-kr0n-line-strong'>·</span>
                          <span>{last90[selectedDay].incident.startTime} — {last90[selectedDay].incident.endTime}</span>
                          <span className='text-kr0n-line-strong'>·</span>
                          <span>{last90[selectedDay].incident.duration}</span>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-3 text-xs text-kr0n-text-secondary'>
                        No incidents reported. All systems operated normally.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── Recent Incidents ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className='text-[10px] font-mono text-kr0n-muted uppercase tracking-wider font-semibold mb-4'>
              Recent Incidents
            </div>

            {last90.filter((d) => d.incident).length > 0 ? (
              <div className='space-y-3'>
                {last90
                  .filter((d) => d.incident)
                  .map((day) => {
                    const config = STATUS_STATE_CONFIG[day.status];
                    return (
                      <div
                        key={day.incident.id}
                        className='border border-kr0n-line-soft bg-kr0n-surface/40 p-4'
                      >
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <div className='flex items-center gap-2'>
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                              <span className='text-sm text-white font-semibold'>
                                {day.incident.title}
                              </span>
                            </div>
                            <p className='text-xs text-kr0n-text-secondary mt-1.5 leading-relaxed'>
                              {day.incident.description}
                            </p>
                            <div className='flex items-center gap-3 mt-2 text-[10px] font-mono text-kr0n-muted'>
                              <span className='text-kr0n-text-secondary font-medium'>{day.dateLabel}</span>
                              <span className='text-kr0n-line-strong'>·</span>
                              <span>{day.incident.system}</span>
                              <span className='text-kr0n-line-strong'>·</span>
                              <span>{day.incident.duration}</span>
                              <span className='text-kr0n-line-strong'>·</span>
                              <span className={`capitalize font-semibold ${
                                day.incident.severity === 'major' ? 'text-red-400' : 'text-amber-400'
                              }`}>
                                {day.incident.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className='text-xs text-kr0n-muted text-center py-6 border border-kr0n-line-soft'>
                No incidents in the last 90 days.
              </div>
            )}
          </motion.div>

          {/* ─── Footer ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className='pt-4 flex items-center gap-4 text-[11px] font-mono text-kr0n-text-secondary'
          >
            <Link
              href='/alerts'
              className='hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wider font-medium'
            >
              View all alerts <ArrowRight size={11} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
