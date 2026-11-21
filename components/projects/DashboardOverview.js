'use client';

import { useState, useEffect } from 'react';
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
import { useKr0nStore } from '@/lib/kr0n-state';
import { getMe, useAuthUser } from '@/lib/auth';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardOverview() {
  const { projects = [], deployments = {}, alerts = [] } = useKr0nStore();
  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (mounted && user) {
          setLiveUser(user);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const greeting = getGreeting();
  const userName =
    currentUser?.displayName ||
    currentUser?.display_name ||
    currentUser?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : null);
  const headingText = userName ? `${greeting}, ${userName}.` : `${greeting}.`;

  const totalServices = (projects || []).reduce((acc, p) => acc + (p.services?.length || 0), 0);
  const healthyCount = (projects || []).filter((p) => p.status === 'healthy').length;
  const attentionCount = (projects || []).filter(
    (p) => p.status === 'warning' || p.status === 'failed'
  ).length;

  // Derive real recent activities from alerts and deployments
  const recentActivity = [];

  (alerts || []).forEach((alert, idx) => {
    recentActivity.push({
      id: alert.id || `alert_${alert.timestamp || idx}`,
      project: alert.projectName || alert.project || 'System',
      action: alert.title || 'Health alert',
      version: alert.serviceName || alert.service || 'system',
      environment: alert.environment || 'production',
      time: alert.timestamp || alert.time || 'Recently',
      status: alert.severity === 'critical' || alert.status === 'firing' ? 'warning' : 'success',
      timestampSort: alert.createdAt ? new Date(alert.createdAt).getTime() : 0,
    });
  });

  Object.entries(deployments || {}).forEach(([key, depList]) => {
    if (Array.isArray(depList)) {
      const proj = (projects || []).find((p) => p.id === key || p.services?.some((s) => s.id === key));
      depList.forEach((dep) => {
        recentActivity.push({
          id: dep.id,
          project: proj?.name || dep.projectName || 'Project',
          action:
            dep.status === 'ready' || dep.status === 'success'
              ? 'Deployed'
              : dep.status === 'building'
              ? 'Deploying'
              : 'Failed',
          version: dep.version || 'v1.0.0',
          environment: dep.environment || proj?.environment || 'production',
          time: dep.timestamp || 'Just now',
          status:
            dep.status === 'ready' || dep.status === 'success'
              ? 'success'
              : dep.status === 'building'
              ? 'in_progress'
              : 'failed',
          timestampSort: dep.createdAt ? new Date(dep.createdAt).getTime() : 0,
        });
      });
    }
  });

  (projects || []).forEach((p) => {
    if (p.currentDeployment && !recentActivity.some((a) => a.id === p.currentDeployment.id)) {
      recentActivity.push({
        id: p.currentDeployment.id,
        project: p.name,
        action:
          p.currentDeployment.status === 'ready' || p.currentDeployment.status === 'success'
            ? 'Deployed'
            : p.currentDeployment.status === 'building'
            ? 'Deploying'
            : 'Failed',
        version: p.currentDeployment.version || 'v1.0.0',
        environment: p.environment || 'production',
        time: p.currentDeployment.timestamp || p.updatedAt || 'Just now',
        status:
          p.currentDeployment.status === 'ready' || p.currentDeployment.status === 'success'
            ? 'success'
            : p.currentDeployment.status === 'building'
            ? 'in_progress'
            : 'failed',
        timestampSort: 0,
      });
    }
  });

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
              {headingText}
            </h1>
            <p className='text-xs font-mono uppercase tracking-wider text-kr0n-muted'>
              KR0N Edge Application Workspace &mdash; {projects.length} {projects.length === 1 ? 'project' : 'projects'} active
            </p>
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
            <div className='text-2xl font-bold text-white'>{projects.length}</div>
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

          {recentActivity.length === 0 ? (
            <div className='bg-kr0n-surface border border-kr0n-line p-8 text-center'>
              <Activity size={24} className='mx-auto text-kr0n-muted mb-2 opacity-50' />
              <div className='text-xs font-mono uppercase tracking-wider text-kr0n-text-secondary'>
                No recent activity
              </div>
              <div className='text-[11px] font-mono text-kr0n-muted mt-1'>
                Deployments and service events will appear here.
              </div>
            </div>
          ) : (
            <div className='bg-kr0n-surface border border-kr0n-line divide-y divide-kr0n-line-soft'>
              {recentActivity.slice(0, 5).map((act) => (
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
          )}
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
            {projects.length === 0 ? (
              <div className='col-span-full bg-kr0n-surface border border-kr0n-line p-8 text-center'>
                <div className='text-xs font-mono uppercase tracking-wider text-kr0n-text-secondary'>
                  No projects deployed
                </div>
                <div className='text-[11px] font-mono text-kr0n-muted mt-1 mb-4'>
                  Create or import a project to launch your services.
                </div>
                <Link
                  href='/projects'
                  className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
                >
                  <span>Launch Workspace</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              projects
                .filter(
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
                        <span>{project.services?.length || 0} services</span>
                        <span className='text-kr0n-line-strong'>|</span>
                        <span>{project.environment}</span>
                        {project.currentDeployment?.version && (
                          <>
                            <span className='text-kr0n-line-strong'>|</span>
                            <span className='text-white font-mono'>
                              {project.currentDeployment.version}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
