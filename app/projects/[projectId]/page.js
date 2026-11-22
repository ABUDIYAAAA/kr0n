'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GitBranch,
  Folder,
  Settings,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Terminal,
  Loader2,
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { getProject } from '@/lib/projects-api';
import { APPLICATION_PRESETS, RepoIcon } from '@/components/projects/github-picker/constants';
import BrandedNotFound from '@/components/common/BrandedNotFound';

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString();
}

export default function ProjectDetailPage({ params }) {
  const { projectId } = use(params);
  const router = useRouter();
  const {
    activeOrgId,
    activeOrg,
    projects,
    presets,
    hasLoaded,
    deleteProject,
    refreshProjects,
  } = useWorkspace();

  const cachedProject = projects.find((p) => p.id === projectId) || null;
  const [liveProject, setLiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');

  useEffect(() => {
    if (!showDeleteModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(false);
        setConfirmDeleteName('');
        setDeleteError('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showDeleteModal]);

  useEffect(() => {
    if (!activeOrgId) {
      if (hasLoaded) {
        Promise.resolve().then(() => {
          setLoading(false);
          setNotFound(true);
        });
      }
      return;
    }

    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setNotFound(false);
        return getProject(activeOrgId, projectId);
      })
      .then((proj) => {
        if (!active) return;
        if (proj?.id) {
          setLiveProject(proj);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeOrgId, projectId, hasLoaded]);

  const project = liveProject || cachedProject;

  if (loading && !project) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3'>
        <Loader2 size={20} className='animate-spin text-kr0n-muted' />
        <p className='text-sm text-kr0n-muted'>Loading project...</p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <BrandedNotFound
        type='Project'
        id={projectId}
        backHref='/projects'
        backLabel='Back to projects'
      />
    );
  }

  const availablePresets =
    Array.isArray(presets) && presets.length > 0 ? presets : APPLICATION_PRESETS;
  const presetMeta =
    availablePresets.find((p) => p.id === project.application_preset) || {
      id: project.application_preset || 'auto',
      name: project.application_preset || 'Auto-detect',
      category: 'auto',
    };

  const buildSettings = project.build_settings || {};
  const effectiveBuild = project.effective_build_settings || {};
  const repoUrl = project.repo_full_name
    ? `https://github.com/${project.repo_full_name}`
    : null;

  async function handleDeleteProject() {
    if (confirmDeleteName !== project.name) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteProject(project.id, activeOrgId);
      await refreshProjects().catch(() => {});
      setShowDeleteModal(false);
      router.push('/projects');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete project.');
      setDeleting(false);
    }
  }

  return (
    <div className='flex-1 flex flex-col min-h-full bg-kr0n-canvas text-kr0n-text'>
      {/* Title Row */}
      <header className='border-b border-kr0n-line bg-kr0n-canvas px-6 sm:px-8 py-6'>
        <div className='max-w-[1240px] flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-start gap-3 min-w-0'>
            <Link
              href='/projects'
              className='text-kr0n-muted hover:text-white transition-colors duration-150 p-1 -ml-1 mt-0.5'
              aria-label='Back to projects'
            >
              <ArrowLeft size={16} />
            </Link>
            <div className='min-w-0 space-y-1'>
              <div className='flex items-center gap-3 flex-wrap'>
                <h1 className='text-2xl font-semibold tracking-tight text-white truncate'>
                  {project.name}
                </h1>
                <span className='text-xs font-mono tabular-nums text-kr0n-muted border-b border-kr0n-accent pb-0.5'>
                  rev {project.revision || 1}
                </span>
              </div>
              <p className='text-[13px] font-mono text-kr0n-muted truncate'>
                {activeOrg?.name ? `${activeOrg.name} / ` : ''}
                {project.slug}
                {project.description ? ` — ${project.description}` : ''}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2.5 shrink-0'>
            {repoUrl && (
              <a
                href={repoUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='h-9 px-3.5 rounded-[6px] border border-kr0n-line hover:border-kr0n-line-strong bg-kr0n-black text-xs font-medium text-kr0n-text-secondary hover:text-white inline-flex items-center gap-1.5 transition-colors duration-150'
              >
                <span>GitHub</span>
                <ExternalLink size={12} />
              </a>
            )}

            <Link
              href={`/projects/${project.id}/settings`}
              className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium inline-flex items-center gap-1.5 transition-colors duration-150'
            >
              <Settings size={13} />
              <span>Configure settings</span>
            </Link>

            <button
              type='button'
              onClick={() => setShowDeleteModal(true)}
              className='h-9 px-3 rounded-[6px] border border-red-500/30 hover:border-red-400 text-kr0n-error text-xs font-medium inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer'
              aria-label='Delete project'
            >
              <Trash2 size={13} />
              <span className='hidden sm:inline'>Delete</span>
            </button>
          </div>
        </div>
      </header>

      <div className='flex-1 max-w-[1240px] w-full px-6 sm:px-8 py-6 space-y-6'>
        {/* Full-width Repository & Source Binding Strip */}
        <div className='grid grid-cols-2 lg:grid-cols-4 rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-kr0n-line'>
          <div className='px-5 py-4 space-y-1 min-w-0'>
            <div className='text-xs text-kr0n-muted'>Repository</div>
            <div className='font-mono text-[13px] text-white truncate'>
              {project.repo_full_name || '—'}
            </div>
          </div>
          <div className='px-5 py-4 space-y-1'>
            <div className='text-xs text-kr0n-muted'>Production branch</div>
            <div className='font-mono text-[13px] text-white inline-flex items-center gap-1.5'>
              <GitBranch size={13} className='text-kr0n-healthy shrink-0' />
              <span>{project.production_branch || 'main'}</span>
            </div>
          </div>
          <div className='px-5 py-4 space-y-1'>
            <div className='text-xs text-kr0n-muted'>Root directory</div>
            <div className='font-mono text-[13px] text-white inline-flex items-center gap-1.5'>
              <Folder size={13} className='text-kr0n-muted shrink-0' />
              <span>{project.root_directory || './'}</span>
            </div>
          </div>
          <div className='px-5 py-4 space-y-1'>
            <div className='text-xs text-kr0n-muted'>Stack preset</div>
            <div className='text-[13px] text-white inline-flex items-center gap-2'>
              <RepoIcon type={presetMeta.id} />
              <span>{presetMeta.name}</span>
            </div>
          </div>
        </div>

        {/* Two height-balanced side-by-side panels */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Effective Build Plan */}
          <div className='lg:col-span-7 rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden flex flex-col justify-between'>
            <div>
              <div className='px-5 h-11 border-b border-kr0n-line-soft flex items-center justify-between'>
                <h2 className='text-[13px] font-semibold text-white'>
                  Effective build plan
                </h2>
                <Link
                  href={`/projects/${project.id}/settings`}
                  className='text-xs text-kr0n-accent hover:underline'
                >
                  Edit overrides
                </Link>
              </div>
              <dl className='divide-y divide-kr0n-line-soft text-[13px]'>
                {[
                  {
                    label: 'Install command',
                    value: effectiveBuild.install_command,
                    overridden: buildSettings.install_command_override,
                  },
                  {
                    label: 'Build command',
                    value: effectiveBuild.build_command,
                    overridden: buildSettings.build_command_override,
                  },
                  {
                    label: 'Output directory',
                    value: effectiveBuild.output_directory,
                    overridden: buildSettings.output_directory_override,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className='px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2'
                  >
                    <dt className='flex items-center gap-2.5 text-kr0n-muted shrink-0'>
                      <span>{item.label}</span>
                      <span
                        className={`text-[11px] font-mono ${
                          item.overridden ? 'text-kr0n-warning' : 'text-kr0n-faint'
                        }`}
                      >
                        {item.overridden ? 'custom' : 'default'}
                      </span>
                    </dt>
                    <dd className='font-mono text-xs text-white break-all sm:text-right'>
                      {item.value || '(none)'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className='px-5 py-3 border-t border-kr0n-line-soft text-xs font-mono tabular-nums text-kr0n-muted'>
              {buildSettings.updated_at
                ? `Build settings updated ${formatDate(buildSettings.updated_at)}`
                : 'Using preset defaults'}
            </div>
          </div>

          {/* Project Metadata & History */}
          <div className='lg:col-span-5 rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden flex flex-col justify-between'>
            <div>
              <div className='px-5 h-11 border-b border-kr0n-line-soft flex items-center justify-between'>
                <h2 className='text-[13px] font-semibold text-white'>
                  Project metadata
                </h2>
                <span className='font-mono text-xs tabular-nums text-kr0n-muted'>
                  #{project.github_installation_id || '—'}
                </span>
              </div>
              <dl className='divide-y divide-kr0n-line-soft text-xs'>
                <div className='px-5 py-3 flex items-center justify-between gap-4'>
                  <dt className='text-kr0n-muted shrink-0'>Project ID</dt>
                  <dd className='font-mono text-kr0n-text-secondary truncate select-all'>
                    {project.id}
                  </dd>
                </div>
                <div className='px-5 py-3 flex items-center justify-between gap-4'>
                  <dt className='text-kr0n-muted shrink-0'>Created by</dt>
                  <dd className='font-mono text-kr0n-text-secondary truncate'>
                    {project.created_by_user_id || '—'}
                  </dd>
                </div>
                <div className='px-5 py-3 flex items-center justify-between gap-4'>
                  <dt className='text-kr0n-muted shrink-0'>Created</dt>
                  <dd className='font-mono tabular-nums text-kr0n-text-secondary'>
                    {formatDate(project.created_at)}
                  </dd>
                </div>
                <div className='px-5 py-3 flex items-center justify-between gap-4'>
                  <dt className='text-kr0n-muted shrink-0'>Last updated</dt>
                  <dd className='font-mono tabular-nums text-white'>
                    {formatDate(project.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>
            <div className='px-5 py-3 border-t border-kr0n-line-soft text-xs text-kr0n-muted'>
              GitHub repository ID <span className='font-mono tabular-nums text-kr0n-text-secondary'>#{project.repo_id || '—'}</span>
            </div>
          </div>
        </div>

        {/* Compact Runtime Deployments Roadmap Strip */}
        <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='flex items-start sm:items-center gap-3'>
            <Terminal size={15} className='text-kr0n-muted shrink-0 mt-0.5 sm:mt-0' />
            <div className='text-[13px] text-kr0n-text-secondary'>
              <span className='text-white font-medium'>Runtime deployments and build logs</span>
              <span className='text-kr0n-muted'> — container build execution, live log streaming, and edge routing will appear here when the execution plane connects.</span>
            </div>
          </div>
          <span className='font-mono text-xs text-kr0n-warning shrink-0'>
            Coming soon
          </span>
        </div>
      </div>

      {/* Delete Project Confirmation Modal */}
      {showDeleteModal && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Confirm project deletion'
          onClick={() => {
            setShowDeleteModal(false);
            setConfirmDeleteName('');
            setDeleteError('');
          }}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='max-w-md w-full rounded-[6px] border border-red-500/35 bg-kr0n-black p-6 space-y-4 shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
          >
            <div className='flex items-center gap-2 text-kr0n-error font-semibold text-sm'>
              <AlertTriangle size={16} />
              <span>Delete project</span>
            </div>
            <p className='text-[13px] text-kr0n-text-secondary leading-relaxed'>
              This permanently removes <strong className='text-white'>{project.name}</strong> (<span className='font-mono text-xs'>{project.id}</span>) from the control plane. This action cannot be undone.
            </p>
            {deleteError && (
              <div className='rounded-[6px] border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300'>
                {deleteError}
              </div>
            )}
            <div className='space-y-1.5'>
              <label htmlFor='delete-project-confirm' className='block text-xs text-kr0n-muted'>
                Type <strong className='font-mono text-white'>{project.name}</strong> to confirm
              </label>
              <input
                id='delete-project-confirm'
                type='text'
                value={confirmDeleteName}
                onChange={(e) => setConfirmDeleteName(e.target.value)}
                placeholder={project.name}
                className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-error px-3 text-sm font-mono text-white outline-none'
              />
            </div>
            <div className='flex items-center justify-end gap-2.5 pt-2'>
              <button
                type='button'
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmDeleteName('');
                  setDeleteError('');
                }}
                className='h-9 px-3.5 rounded-[6px] border border-kr0n-line text-xs font-medium text-kr0n-text-secondary hover:text-white transition-colors duration-150 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                disabled={confirmDeleteName !== project.name || deleting}
                onClick={handleDeleteProject}
                className='h-9 px-4 rounded-[6px] bg-kr0n-error hover:opacity-90 disabled:opacity-40 text-white text-xs font-medium transition-opacity duration-150 cursor-pointer'
              >
                {deleting ? 'Deleting...' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
