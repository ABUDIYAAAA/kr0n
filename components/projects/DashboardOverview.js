'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  GitBranch,
  Folder,
  Plus,
  Check,
  Settings,
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { getAuditLogs, getMembers } from '@/lib/auth';
import { githubApi } from '@/lib/github-api';

function formatShortDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DashboardOverview() {
  const {
    activeOrg,
    activeOrgId,
    projects = [],
    isLoadingProjects,
  } = useWorkspace();

  const [auditEvents, setAuditEvents] = useState([]);
  const [membersCount, setMembersCount] = useState(null);
  const [installationsCount, setInstallationsCount] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (!activeOrgId) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setMetaLoading(true);
        return Promise.all([
          getAuditLogs(activeOrgId, { limit: 5, offset: 0 }).catch(() => []),
          getMembers(activeOrgId).catch(() => []),
          githubApi(`orgs/${activeOrgId}/github/installations`).catch(() => ({
            installations: [],
          })),
        ]);
      })
      .then(([events, members, gh]) => {
        if (!active) return;
        setAuditEvents(Array.isArray(events) ? events : []);
        setMembersCount(Array.isArray(members) ? members.length : 0);
        setInstallationsCount(Array.isArray(gh?.installations) ? gh.installations.length : 0);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeOrgId]);

  const showSetupChecklist =
    !metaLoading &&
    !isLoadingProjects &&
    (projects.length === 0 || installationsCount === 0);

  const checklistSteps = [
    {
      label: 'Organization active',
      done: Boolean(activeOrg?.id),
      href: '/settings',
      cta: activeOrg?.name || 'Manage',
    },
    {
      label: 'Connect GitHub App',
      done: (installationsCount || 0) > 0,
      href: '/projects/new',
      cta: 'Install',
    },
    {
      label: 'Import first repository',
      done: projects.length > 0,
      href: '/projects/new',
      cta: 'Import',
    },
    {
      label: 'Invite teammates',
      done: (membersCount || 0) > 1,
      href: '/settings',
      cta: 'Members',
    },
  ];

  return (
    <div className='flex-1 overflow-auto'>
      {/* Title Row */}
      <div className='px-6 sm:px-8 pt-7 pb-6 border-b border-kr0n-line'>
        <div className='max-w-[1240px] flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight text-white'>
              {activeOrg?.name || 'Overview'}
            </h1>
            <p className='text-[13px] text-kr0n-muted flex flex-wrap items-center gap-x-2 gap-y-1'>
              {activeOrg?.slug && (
                <span className='font-mono text-kr0n-text-secondary'>{activeOrg.slug}</span>
              )}
              <span>·</span>
              <span className='font-mono'>{activeOrg?.role_id || 'member'}</span>
              {installationsCount !== null && (
                <>
                  <span>·</span>
                  <span>
                    {installationsCount > 0
                      ? `${installationsCount} GitHub ${installationsCount === 1 ? 'installation' : 'installations'} linked`
                      : 'GitHub App not connected'}
                  </span>
                </>
              )}
            </p>
          </div>

          <Link
            href='/projects/new'
            className='inline-flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-[13px] font-medium transition-colors duration-150 self-start sm:self-auto'
          >
            <Plus size={14} />
            <span>Import repository</span>
          </Link>
        </div>
      </div>

      <div className='px-6 sm:px-8 py-6 space-y-6 max-w-[1240px]'>
        {/* Divided 3-column summary strip (no tiles, no decorative icons) */}
        <div className='grid grid-cols-1 sm:grid-cols-3 rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-kr0n-line'>
          <div className='px-5 py-4 space-y-1'>
            <div className='text-xs text-kr0n-muted'>Connected projects</div>
            <div className='text-2xl font-normal font-mono tabular-nums text-white'>
              {projects.length}
            </div>
          </div>
          <div className='px-5 py-4 space-y-1'>
            <div className='text-xs text-kr0n-muted'>GitHub installations</div>
            <div className='text-2xl font-normal font-mono tabular-nums text-white'>
              {installationsCount === null ? '—' : installationsCount}
            </div>
          </div>
          <div className='px-5 py-4 space-y-1'>
            <div className='text-xs text-kr0n-muted'>Organization members</div>
            <div className='text-2xl font-normal font-mono tabular-nums text-white'>
              {membersCount === null ? '—' : membersCount}
            </div>
          </div>
        </div>

        {/* Onboarding Setup Checklist when org has no GitHub App or projects */}
        {showSetupChecklist && (
          <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden'>
            <div className='px-5 py-3 border-b border-kr0n-line-soft flex items-center justify-between text-xs'>
              <span className='font-medium text-white'>Workspace setup</span>
              <span className='font-mono tabular-nums text-kr0n-muted'>
                {checklistSteps.filter((s) => s.done).length} / {checklistSteps.length} complete
              </span>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-kr0n-line-soft'>
              {checklistSteps.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className='px-5 py-4 flex items-center justify-between gap-3 hover:bg-kr0n-surface-2/50 transition-colors duration-150'
                >
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        step.done
                          ? 'border-kr0n-healthy bg-kr0n-healthy/15 text-kr0n-healthy'
                          : 'border-kr0n-line-strong'
                      }`}
                    >
                      {step.done && <Check size={10} />}
                    </span>
                    <span
                      className={`text-[13px] truncate ${
                        step.done ? 'text-kr0n-muted' : 'text-white font-medium'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!step.done && (
                    <span className='text-xs text-kr0n-accent shrink-0'>{step.cta}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Balanced 2-column content: Projects Table + Recent Audit Activity */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
          {/* Projects Table */}
          <div className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden'>
            <div className='px-5 h-11 border-b border-kr0n-line-soft flex items-center justify-between'>
              <h2 className='text-[13px] font-semibold text-white'>
                Projects
              </h2>
              <Link
                href='/projects'
                className='text-xs text-kr0n-muted hover:text-white inline-flex items-center gap-1 transition-colors duration-150'
              >
                <span>View all</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {isLoadingProjects ? (
              <div className='px-5 py-10 text-center text-[13px] text-kr0n-muted'>
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className='px-5 py-10 text-center space-y-3'>
                <p className='text-[13px] font-medium text-white'>
                  No repositories connected yet
                </p>
                <p className='text-xs text-kr0n-muted max-w-sm mx-auto'>
                  Import a GitHub repository to configure its branch, root directory, and build settings.
                </p>
                <div className='pt-1'>
                  <Link
                    href='/projects/new'
                    className='inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium transition-colors duration-150'
                  >
                    <Plus size={13} />
                    <span>Import repository</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-[13px]'>
                  <thead>
                    <tr className='border-b border-kr0n-line-soft text-xs text-kr0n-muted'>
                      <th className='px-5 py-2.5 font-normal'>Project</th>
                      <th className='px-4 py-2.5 font-normal'>Branch &amp; root</th>
                      <th className='px-4 py-2.5 font-normal'>Preset</th>
                      <th className='px-4 py-2.5 font-normal text-right'>Rev</th>
                      <th className='px-5 py-2.5 font-normal text-right'>Updated</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-kr0n-line-soft'>
                    {projects.slice(0, 6).map((project) => (
                      <tr
                        key={project.id}
                        className='hover:bg-kr0n-surface-2/50 transition-colors duration-150'
                      >
                        <td className='px-5 py-3'>
                          <Link
                            href={`/projects/${project.id}`}
                            className='font-medium text-white hover:text-kr0n-accent transition-colors duration-150 block truncate max-w-[220px]'
                          >
                            {project.name}
                          </Link>
                          <div className='font-mono text-xs text-kr0n-muted truncate max-w-[220px]'>
                            {project.repo_full_name || project.slug}
                          </div>
                        </td>
                        <td className='px-4 py-3 font-mono text-xs text-kr0n-text-secondary'>
                          <div className='flex items-center gap-3'>
                            <span className='inline-flex items-center gap-1'>
                              <GitBranch size={12} className='text-kr0n-muted' />
                              {project.production_branch || 'main'}
                            </span>
                            <span className='inline-flex items-center gap-1 text-kr0n-muted'>
                              <Folder size={12} />
                              {project.root_directory || './'}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-3 font-mono text-xs text-kr0n-text-secondary'>
                          {project.application_preset || 'auto'}
                        </td>
                        <td className='px-4 py-3 text-right font-mono text-xs tabular-nums text-white'>
                          v{project.revision || 1}
                        </td>
                        <td className='px-5 py-3 text-right'>
                          <div className='inline-flex items-center justify-end gap-3'>
                            <span className='font-mono text-xs tabular-nums text-kr0n-muted'>
                              {formatShortDate(project.updated_at || project.created_at)}
                            </span>
                            <Link
                              href={`/projects/${project.id}/settings`}
                              aria-label={`Settings for ${project.name}`}
                              className='text-kr0n-muted hover:text-white transition-colors duration-150'
                            >
                              <Settings size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Organization Activity (Live Audit Stream) */}
          <div className='lg:col-span-4 rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden'>
            <div className='px-5 h-11 border-b border-kr0n-line-soft flex items-center justify-between'>
              <h2 className='text-[13px] font-semibold text-white'>
                Recent activity
              </h2>
              <Link
                href='/settings'
                className='text-xs text-kr0n-muted hover:text-white transition-colors duration-150'
              >
                Audit log
              </Link>
            </div>

            {metaLoading && auditEvents.length === 0 ? (
              <div className='px-5 py-8 text-center text-xs text-kr0n-muted'>
                Loading activity...
              </div>
            ) : auditEvents.length === 0 ? (
              <div className='px-5 py-8 text-center text-xs text-kr0n-muted'>
                No organization events recorded yet.
              </div>
            ) : (
              <div className='divide-y divide-kr0n-line-soft'>
                {auditEvents.map((ev) => (
                  <div key={ev.id} className='px-5 py-3 space-y-1'>
                    <div className='flex items-center justify-between gap-2 text-xs'>
                      <span className='font-mono text-kr0n-text truncate'>
                        {ev.action}
                      </span>
                      <span className='font-mono tabular-nums text-kr0n-muted shrink-0'>
                        {formatShortDate(ev.created_at)}
                      </span>
                    </div>
                    <div className='font-mono text-xs text-kr0n-muted truncate'>
                      {ev.resource_type
                        ? `${ev.resource_type}${ev.resource_id ? `:${ev.resource_id.slice(0, 8)}` : ''}`
                        : ev.actor_user_id || ev.actor_type || 'system'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
