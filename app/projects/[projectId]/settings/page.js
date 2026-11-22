'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import {
  getProject,
  buildBuildSettingsPayload,
} from '@/lib/projects-api';
import { APPLICATION_PRESETS } from '@/components/projects/github-picker/constants';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function ProjectSettingsPage({ params }) {
  const { projectId } = use(params);
  const router = useRouter();
  const {
    activeOrgId,
    projects,
    presets,
    hasLoaded,
    updateProject,
    updateProjectBuildSettings,
    deleteProject,
    refreshProjects,
  } = useWorkspace();

  const cachedProject = projects.find((p) => p.id === projectId) || null;
  const [liveProject, setLiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const project = liveProject || cachedProject;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productionBranch, setProductionBranch] = useState('main');
  const [rootDirectory, setRootDirectory] = useState('./');
  const [applicationPreset, setApplicationPreset] = useState('auto');

  const [installOverride, setInstallOverride] = useState(false);
  const [customInstallCommand, setCustomInstallCommand] = useState('');
  const [buildOverride, setBuildOverride] = useState(false);
  const [customBuildCommand, setCustomBuildCommand] = useState('');
  const [outputOverride, setOutputOverride] = useState(false);
  const [customOutputDir, setCustomOutputDir] = useState('');

  const [syncedRevisionKey, setSyncedRevisionKey] = useState('');
  const currentRevisionKey = project ? `${project.id}:${project.revision}` : '';
  if (project && syncedRevisionKey !== currentRevisionKey) {
    setSyncedRevisionKey(currentRevisionKey);
    setName(project.name || '');
    setDescription(project.description || '');
    setProductionBranch(project.production_branch || 'main');
    setRootDirectory(project.root_directory || './');
    setApplicationPreset(project.application_preset || 'auto');

    const bs = project.build_settings || {};
    setInstallOverride(Boolean(bs.install_command_override));
    setCustomInstallCommand(bs.install_command || '');
    setBuildOverride(Boolean(bs.build_command_override));
    setCustomBuildCommand(bs.build_command || '');
    setOutputOverride(Boolean(bs.output_directory_override));
    setCustomOutputDir(bs.output_directory || '');
  }

  const [isMetaDirty, setIsMetaDirty] = useState(false);
  const [isBuildDirty, setIsBuildDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedFeedback, setSavedFeedback] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!showDeleteModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(false);
        setConfirmName('');
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

  if (loading && !project) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3'>
        <Loader2 size={20} className='animate-spin text-kr0n-muted' />
        <p className='text-sm text-kr0n-muted'>Loading project settings...</p>
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
  const selectedPresetMeta =
    availablePresets.find((p) => p.id === applicationPreset) || availablePresets[0];

  const isDirty = isMetaDirty || isBuildDirty;

  const handleReset = () => {
    setName(project.name || '');
    setDescription(project.description || '');
    setProductionBranch(project.production_branch || 'main');
    setRootDirectory(project.root_directory || './');
    setApplicationPreset(project.application_preset || 'auto');

    const bs = project.build_settings || {};
    setInstallOverride(Boolean(bs.install_command_override));
    setCustomInstallCommand(bs.install_command || '');
    setBuildOverride(Boolean(bs.build_command_override));
    setCustomBuildCommand(bs.build_command || '');
    setOutputOverride(Boolean(bs.output_directory_override));
    setCustomOutputDir(bs.output_directory || '');

    setIsMetaDirty(false);
    setIsBuildDirty(false);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!activeOrgId || !project?.id || !isDirty) return;
    setSaving(true);
    setSaveError('');
    setSavedFeedback('');

    try {
      let currentProj = project;

      if (isMetaDirty) {
        currentProj = await updateProject(project.id, {
          orgId: activeOrgId,
          name: name.trim() || project.name,
          description: description.trim(),
          production_branch: productionBranch.trim() || 'main',
          root_directory: rootDirectory.trim() || './',
          application_preset: applicationPreset,
          expected_revision: currentProj.revision,
        });
        setLiveProject(currentProj);
        setIsMetaDirty(false);
      }

      if (isBuildDirty) {
        const buildPayload = buildBuildSettingsPayload({
          installOverride,
          customInstallCommand,
          buildOverride,
          customBuildCommand,
          outputOverride,
          customOutputDir,
        });
        currentProj = await updateProjectBuildSettings(project.id, {
          orgId: activeOrgId,
          build_settings: buildPayload,
          expected_revision: currentProj.revision,
        });
        setLiveProject(currentProj);
        setIsBuildDirty(false);
      }

      setSavedFeedback(`Saved changes (revision ${currentProj.revision}).`);
      setTimeout(() => setSavedFeedback(''), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save project settings.');
      if (err.status === 409) {
        const latest = await getProject(activeOrgId, project.id).catch(() => null);
        if (latest) setLiveProject(latest);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (confirmName !== project.name || !activeOrgId) return;
    setDeleting(true);
    setSaveError('');
    try {
      await deleteProject(project.id, activeOrgId);
      await refreshProjects().catch(() => {});
      setShowDeleteModal(false);
      router.push('/projects');
    } catch (err) {
      setSaveError(err.message || 'Failed to delete project.');
      setDeleting(false);
    }
  };

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* Header */}
      <div className='border-b border-kr0n-line bg-kr0n-canvas px-6 sm:px-8 py-6'>
        <div className='max-w-[1152px] flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <Link
              href={`/projects/${projectId}`}
              className='inline-flex items-center gap-1.5 text-xs text-kr0n-muted hover:text-white transition-colors duration-150'
            >
              <ArrowLeft size={13} />
              <span>{project.name}</span>
            </Link>
            <h1 className='text-2xl font-semibold tracking-tight text-white'>
              Project settings
            </h1>
          </div>

          <div className='flex items-center gap-3'>
            <span className='font-mono text-xs tabular-nums text-kr0n-muted'>
              rev {project.revision}
            </span>
            <button
              type='button'
              disabled={!isDirty || saving}
              onClick={handleSave}
              className='inline-flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-[13px] font-medium transition-colors duration-150 disabled:opacity-35 cursor-pointer'
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dirty / Feedback Strips */}
      {isDirty && (
        <div className='sticky top-0 z-30 bg-kr0n-black border-b border-kr0n-accent px-6 sm:px-8 py-2.5 flex items-center justify-between gap-4 text-xs'>
          <span className='text-white font-medium'>
            Unsaved edits against revision {project.revision}
          </span>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              disabled={saving}
              onClick={handleReset}
              className='text-kr0n-muted hover:text-white transition-colors duration-150 cursor-pointer'
            >
              Discard
            </button>
            <button
              type='button'
              disabled={saving}
              onClick={handleSave}
              className='h-7 px-3 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black font-medium disabled:opacity-50 transition-colors duration-150 cursor-pointer'
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className='bg-red-500/10 border-b border-red-500/30 px-6 sm:px-8 py-2.5 flex items-center gap-2 text-xs text-red-300'>
          <AlertTriangle size={14} className='text-kr0n-error shrink-0' />
          <span>{saveError}</span>
        </div>
      )}

      {savedFeedback && (
        <div className='sticky top-0 z-30 bg-kr0n-healthy/15 border-b border-kr0n-healthy/40 px-6 sm:px-8 py-2.5 flex items-center gap-2 text-xs text-kr0n-healthy'>
          <CheckCircle2 size={14} className='shrink-0' />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Two-Column Settings Layout */}
      <div className='flex-1 px-6 sm:px-8 py-8 max-w-[1152px] w-full divide-y divide-kr0n-line'>
        {/* Row 1: Identity */}
        <section className='pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-4 space-y-2 pt-1'>
            <h2 className='text-base font-medium text-white'>Project identity</h2>
            <p className='text-[13px] text-kr0n-muted leading-relaxed'>
              Name and summary shown across your organization workspace.
            </p>
            <dl className='pt-3 space-y-1.5 text-xs font-mono text-kr0n-muted'>
              <div>
                <dt className='inline text-kr0n-faint'>Slug: </dt>
                <dd className='inline text-kr0n-text-secondary'>{project.slug}</dd>
              </div>
              <div className='truncate'>
                <dt className='inline text-kr0n-faint'>ID: </dt>
                <dd className='inline text-kr0n-text-secondary select-all'>{project.id}</dd>
              </div>
            </dl>
          </div>

          <div className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-4'>
            <div className='space-y-1.5'>
              <label htmlFor='proj-name' className='block text-[13px] font-medium text-white'>
                Project name
              </label>
              <input
                id='proj-name'
                type='text'
                maxLength={100}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsMetaDirty(true);
                }}
                className='w-full h-10 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent px-3 text-sm text-white outline-none transition-colors duration-150'
              />
            </div>

            <div className='space-y-1.5'>
              <label htmlFor='proj-desc' className='block text-[13px] font-medium text-white'>
                Description
              </label>
              <textarea
                id='proj-desc'
                rows={2}
                maxLength={500}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsMetaDirty(true);
                }}
                placeholder='Optional project summary'
                className='w-full rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent px-3 py-2 text-sm text-white outline-none resize-none transition-colors duration-150'
              />
            </div>
          </div>
        </section>

        {/* Row 2: Git Source & Preset */}
        <section className='py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-4 space-y-2 pt-1'>
            <h2 className='text-base font-medium text-white'>Git source and preset</h2>
            <p className='text-[13px] text-kr0n-muted leading-relaxed'>
              Control the production branch, monorepo root directory, and stack preset bound to this repository.
            </p>
            <div className='pt-3 space-y-1 text-xs font-mono text-kr0n-muted'>
              <div className='truncate text-kr0n-text-secondary'>
                {project.repo_full_name || '—'}
              </div>
              <div>Installation #{project.github_installation_id || '—'}</div>
            </div>
          </div>

          <div className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label htmlFor='proj-branch' className='block text-[13px] font-medium text-white'>
                  Production branch
                </label>
                <input
                  id='proj-branch'
                  type='text'
                  maxLength={255}
                  value={productionBranch}
                  onChange={(e) => {
                    setProductionBranch(e.target.value);
                    setIsMetaDirty(true);
                  }}
                  placeholder='main'
                  className='w-full h-10 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent px-3 text-sm font-mono text-white outline-none transition-colors duration-150'
                />
              </div>

              <div className='space-y-1.5'>
                <label htmlFor='proj-root' className='block text-[13px] font-medium text-white'>
                  Root directory
                </label>
                <input
                  id='proj-root'
                  type='text'
                  maxLength={255}
                  value={rootDirectory}
                  onChange={(e) => {
                    setRootDirectory(e.target.value);
                    setIsMetaDirty(true);
                  }}
                  placeholder='./'
                  className='w-full h-10 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent px-3 text-sm font-mono text-white outline-none transition-colors duration-150'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label htmlFor='proj-preset' className='block text-[13px] font-medium text-white'>
                Application preset
              </label>
              <select
                id='proj-preset'
                value={applicationPreset}
                onChange={(e) => {
                  setApplicationPreset(e.target.value);
                  setIsMetaDirty(true);
                }}
                className='w-full h-10 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent px-3 text-sm text-white outline-none transition-colors duration-150'
              >
                {availablePresets.map((p) => (
                  <option key={p.id} value={p.id} className='bg-kr0n-black text-white'>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Row 3: Build Overrides */}
        <section className='py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-4 space-y-2 pt-1'>
            <h2 className='text-base font-medium text-white'>Build command overrides</h2>
            <p className='text-[13px] text-kr0n-muted leading-relaxed'>
              Override default commands for <span className='text-white'>{selectedPresetMeta?.name}</span>. Leaving an enabled override blank intentionally skips that step.
            </p>
          </div>

          <div className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-4'>
            {[
              {
                id: 'settings-install-cmd',
                label: 'Install command',
                override: installOverride,
                setOverride: setInstallOverride,
                value: customInstallCommand,
                setValue: setCustomInstallCommand,
                fallback: selectedPresetMeta?.installCommand || 'Leave empty to skip install step',
                defaultText: selectedPresetMeta?.installCommand || '(none)',
              },
              {
                id: 'settings-build-cmd',
                label: 'Build command',
                override: buildOverride,
                setOverride: setBuildOverride,
                value: customBuildCommand,
                setValue: setCustomBuildCommand,
                fallback: selectedPresetMeta?.buildCommand || 'Leave empty to skip build step',
                defaultText: selectedPresetMeta?.buildCommand || '(none)',
              },
              {
                id: 'settings-output-dir',
                label: 'Output directory',
                override: outputOverride,
                setOverride: setOutputOverride,
                value: customOutputDir,
                setValue: setCustomOutputDir,
                fallback: selectedPresetMeta?.outputDir || 'Output directory',
                defaultText: selectedPresetMeta?.outputDir || '(none)',
              },
            ].map((field) => (
              <div key={field.id} className='space-y-1.5'>
                <div className='flex items-center justify-between gap-2'>
                  <label htmlFor={field.id} className='text-[13px] font-medium text-white'>
                    {field.label}
                  </label>
                  <button
                    type='button'
                    role='switch'
                    aria-checked={field.override}
                    onClick={() => {
                      const next = !field.override;
                      field.setOverride(next);
                      if (!next) field.setValue('');
                      setIsBuildDirty(true);
                    }}
                    className={`text-xs pb-0.5 border-b transition-colors duration-150 cursor-pointer ${
                      field.override
                        ? 'border-kr0n-accent text-white font-medium'
                        : 'border-transparent text-kr0n-muted hover:text-white'
                    }`}
                  >
                    {field.override ? 'Custom override' : 'Preset default'}
                  </button>
                </div>
                <input
                  id={field.id}
                  type='text'
                  disabled={!field.override}
                  value={field.override ? field.value : ''}
                  onChange={(e) => {
                    field.setValue(e.target.value);
                    setIsBuildDirty(true);
                  }}
                  placeholder={field.override ? field.fallback : field.defaultText}
                  className='w-full h-10 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent px-3 text-sm font-mono text-white outline-none disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-150'
                />
              </div>
            ))}
          </div>
        </section>

        {/* Row 4: Danger Zone */}
        <section className='pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-4 space-y-1.5 pt-1'>
            <h2 className='text-base font-medium text-kr0n-error'>Danger zone</h2>
            <p className='text-[13px] text-kr0n-muted leading-relaxed'>
              Permanently remove this project and its build configuration from the control plane.
            </p>
          </div>

          <div className='lg:col-span-8 rounded-[6px] border border-red-500/30 bg-kr0n-black p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='space-y-1'>
              <div className='text-sm font-medium text-white'>Delete {project.name}</div>
              <p className='text-xs text-kr0n-muted'>
                This action cannot be undone and immediately frees the project slug.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowDeleteModal(true)}
              className='h-9 px-4 rounded-[6px] border border-red-500/40 hover:border-red-400 text-kr0n-error text-xs font-medium transition-colors duration-150 shrink-0 cursor-pointer'
            >
              Delete project
            </button>
          </div>
        </section>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Confirm project deletion'
          onClick={() => {
            setShowDeleteModal(false);
            setConfirmName('');
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
              This permanently removes <strong className='text-white'>{project.name}</strong> (<span className='font-mono text-xs'>{project.id}</span>) from the control plane.
            </p>
            <div className='space-y-1.5'>
              <label htmlFor='settings-delete-confirm' className='block text-xs text-kr0n-muted'>
                Type <strong className='font-mono text-white'>{project.name}</strong> to confirm
              </label>
              <input
                id='settings-delete-confirm'
                type='text'
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={project.name}
                className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-error px-3 text-sm font-mono text-white outline-none'
              />
            </div>
            <div className='flex items-center justify-end gap-2.5 pt-2'>
              <button
                type='button'
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmName('');
                }}
                className='h-9 px-3.5 rounded-[6px] border border-kr0n-line text-xs font-medium text-kr0n-text-secondary hover:text-white cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                disabled={confirmName !== project.name || deleting}
                onClick={handleDeleteProject}
                className='h-9 px-4 rounded-[6px] bg-kr0n-error hover:opacity-90 text-white text-xs font-medium disabled:opacity-40 cursor-pointer'
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
