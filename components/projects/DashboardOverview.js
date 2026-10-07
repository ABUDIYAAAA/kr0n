'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowRight,
  Rocket,
  Activity,
  AlertTriangle,
  Clock,
  Globe,
  GitBranch,
} from 'lucide-react';
import { PROJECTS } from '@/lib/projects-data';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const RECENT_ACTIVITY = [
  {
    id: 'act_1',
    project: 'Orvea',
    action: 'Deployed',
    version: 'v1.8.4',
    environment: 'production',
    time: '2m ago',
    status: 'success',
  },
  {
    id: 'act_2',
    project: 'Orvea',
    action: 'Deploying',
    version: 'v1.9.0-rc.2',
    environment: 'staging',
    time: '1m ago',
    status: 'in_progress',
  },
  {
    id: 'act_3',
    project: 'Atlas',
    action: 'Deployed',
    version: 'v3.2.1',
    environment: 'production',
    time: '14m ago',
    status: 'success',
  },
  {
    id: 'act_4',
    project: 'Nebula',
    action: 'Health alert',
    version: 'v2.1.0',
    environment: 'production',
    time: '48m ago',
    status: 'warning',
  },
];

export default function DashboardOverview() {
  const greeting = getGreeting();
  const totalServices = PROJECTS.reduce((acc, p) => acc + p.services.length, 0);
  const healthyCount = PROJECTS.filter((p) => p.status === 'healthy').length;
  const attentionCount = PROJECTS.filter(
    (p) => p.status === 'warning' || p.status === 'failed'
  ).length;

  return (
    <div className='flex-1 overflow-auto'>
      {/* ─── Hero Section ─── */}
      <div className='px-6 sm:px-8 pt-8 pb-6 border-b border-kr0n-line'>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'
        >
          <div className='space-y-1.5'>
            <h1 className='text-2xl sm:text-3xl font-black font-mono tracking-tight text-white'>
              {greeting}.
            </h1>
            <p className='text-xs font-mono uppercase tracking-wider text-kr0n-muted'>
              KR0N Edge Application Workspace &mdash; 5 clusters active
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Link
              href='/projects'
              className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
            >
              <span>Launch Workspace</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className='px-6 sm:px-8 py-8 space-y-8 max-w-5xl'>
        {/* ─── Quick Stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className='grid grid-cols-2 md:grid-cols-4 gap-4'
        >
          <div className='bg-kr0n-surface border border-kr0n-line p-4 space-y-1'>
            <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-wider font-bold'>
              Projects
            </div>
            <div className='text-2xl font-bold text-white'>{PROJECTS.length}</div>
          </div>
          <div className='bg-kr0n-surface border border-kr0n-line p-4 space-y-1'>
            <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-wider font-bold'>
              Services
            </div>
            <div className='text-2xl font-bold text-white'>{totalServices}</div>
          </div>
          <div className='bg-kr0n-surface border border-kr0n-line p-4 space-y-1'>
            <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-wider font-bold'>
              Healthy
            </div>
            <div className='text-2xl font-bold text-emerald-400 flex items-center gap-2'>
              {healthyCount}
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
            </div>
          </div>
          <div className='bg-kr0n-surface border border-kr0n-line p-4 space-y-1'>
            <div className='text-[10px] font-mono text-kr0n-text-secondary uppercase tracking-wider font-bold'>
              Attention
            </div>
            <div
              className={`text-2xl font-bold ${
                attentionCount > 0 ? 'text-amber-400' : 'text-kr0n-muted'
              }`}
            >
              {attentionCount}
              {attentionCount > 0 && (
                <AlertTriangle
                  size={14}
                  className='inline ml-2 text-amber-400'
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Recent Activity ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className='space-y-3'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Recent Activity
            </h2>
            <Link
              href='/projects'
              className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider font-bold'
            >
              View all
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className='bg-kr0n-surface border border-kr0n-line divide-y divide-kr0n-line-soft'>
            {RECENT_ACTIVITY.map((act) => (
              <div
                key={act.id}
                className='flex items-center justify-between px-4 py-3 hover:bg-white/[0.015] transition-colors'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      act.status === 'success'
                        ? 'bg-emerald-400'
                        : act.status === 'in_progress'
                        ? 'bg-blue-400 animate-pulse'
                        : act.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <div className='min-w-0'>
                    <div className='text-xs text-white truncate'>
                      <span className='font-bold'>{act.project}</span>
                      <span className='text-kr0n-muted mx-1.5'>·</span>
                      <span className='text-kr0n-text-secondary'>{act.action}</span>
                    </div>
                    <div className='text-[11px] font-mono text-kr0n-muted flex items-center gap-2 mt-0.5 font-medium'>
                      <span className='text-kr0n-text-secondary font-mono'>{act.version}</span>
                      <span className='text-kr0n-line-strong'>|</span>
                      <span>{act.environment}</span>
                    </div>
                  </div>
                </div>
                <span className='text-[11px] font-mono text-kr0n-muted shrink-0 ml-4 font-medium'>
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Recent Projects ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className='space-y-3'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xs font-mono uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Projects
            </h2>
            <Link
              href='/projects'
              className='text-[11px] font-mono text-kr0n-text-secondary hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider font-bold'
            >
              Open workspace
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {PROJECTS.filter(
              (p, i, arr) => arr.findIndex((x) => x.name === p.name) === i
            )
              .slice(0, 4)
              .map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className='block bg-kr0n-surface border border-kr0n-line hover:border-kr0n-line-strong p-4 space-y-3 transition-colors group'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            project.status === 'healthy'
                              ? 'bg-emerald-400'
                              : project.status === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                          }`}
                        />
                        <span className='text-sm font-bold text-white uppercase tracking-wider'>
                          {project.name}
                        </span>
                      </div>
                      <ArrowRight
                        size={13}
                        className='text-kr0n-muted group-hover:text-white transition-colors'
                      />
                    </div>
                    <p className='text-xs text-kr0n-text-secondary'>{project.description}</p>
                    <div className='flex items-center gap-3 text-[11px] font-mono text-kr0n-text-secondary font-medium'>
                      <span>{project.services.length} services</span>
                      <span className='text-kr0n-line-strong'>|</span>
                      <span>{project.environment}</span>
                      <span className='text-kr0n-line-strong'>|</span>
                      <span className='text-white font-mono'>{project.currentDeployment.version}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
