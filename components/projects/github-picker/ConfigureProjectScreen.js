'use client';

import {
  ArrowLeft,
  GitBranch,
  Folder,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { GithubIcon } from '@/components/auth/OAuthButtons';
import { APPLICATION_PRESETS, RepoIcon } from './constants';

export default function ConfigureProjectScreen({
  selectedRepo,
  accountLogin,
  branches = [],
  selectedBranch,
  setSelectedBranch,
  onBack,
  teamDisplayName,
  showTeamMenu,
  setShowTeamMenu,
  teamMenuRef,
  organizations,
  selectedOrgId,
  setSelectedOrgId,
  refreshGitHubState,
  projectName,
  setProjectName,
  projectDescription = '',
  setProjectDescription,
  selectedDir,
  onOpenDirModal,
  availablePresets = APPLICATION_PRESETS,
  presetId,
  setPresetId,
  currentPreset,
  showPresetMenu,
  setShowPresetMenu,
  presetMenuRef,
  expandBuildSettings,
  setExpandBuildSettings,
  buildOverride,
  setBuildOverride,
  customBuildCommand,
  setCustomBuildCommand,
  outputOverride,
  setOutputOverride,
  customOutputDir,
  setCustomOutputDir,
  installOverride,
  setInstallOverride,
  customInstallCommand,
  setCustomInstallCommand,
  deployError,
  busy,
  handleDeploy,
}) {
  const branchOptions =
    Array.isArray(branches) && branches.length > 0
      ? branches
      : [{ name: selectedBranch || selectedRepo?.default_branch || 'main' }];

  const effectiveInstall = installOverride
    ? customInstallCommand || '(skipped)'
    : currentPreset.installCommand || '(preset default)';
  const effectiveBuild = buildOverride
    ? customBuildCommand || '(skipped)'
    : currentPreset.buildCommand || '(preset default)';
  const effectiveOutput = outputOverride
    ? customOutputDir || '(none)'
    : currentPreset.outputDir || '(preset default)';

  return (
    <div className='w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
      {/* Left: Main configuration form */}
      <div className='lg:col-span-7 border border-kr0n-line bg-kr0n-black rounded-[6px] p-6 sm:p-7 space-y-6'>
        <div className='flex items-center justify-between gap-4 border-b border-kr0n-line-soft pb-4'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight text-white'>
              Configure project
            </h1>
            <p className='text-[13px] text-kr0n-muted mt-0.5'>
              Confirm repository source and optional build overrides.
            </p>
          </div>
          <button
            type='button'
            onClick={onBack}
            className='inline-flex items-center gap-1.5 text-xs text-kr0n-muted hover:text-white transition-colors duration-150 cursor-pointer shrink-0'
          >
            <ArrowLeft size={14} />
            <span>Repositories</span>
          </button>
        </div>

        {deployError && (
          <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-[6px] text-xs text-red-300 flex items-start gap-2.5'>
            <AlertCircle size={15} className='shrink-0 mt-0.5 text-red-400' />
            <span>{deployError}</span>
          </div>
        )}

        {/* Organization & Project Name */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='relative space-y-1.5' ref={teamMenuRef}>
            <label className='block text-xs font-medium text-kr0n-text-secondary'>
              Organization
            </label>
            <button
              type='button'
              onClick={() => setShowTeamMenu((prev) => !prev)}
              className='w-full h-9 border border-kr0n-line bg-kr0n-canvas hover:border-kr0n-line-strong rounded-[6px] px-3 flex items-center justify-between text-[13px] text-white transition-colors duration-150 cursor-pointer text-left'
            >
              <span className='truncate font-medium'>{teamDisplayName}</span>
              <ChevronDown
                size={14}
                className={`text-kr0n-muted shrink-0 ml-2 transition-transform duration-150 ${
                  showTeamMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showTeamMenu && (
              <div className='absolute left-0 right-0 mt-1 border border-kr0n-line bg-kr0n-black rounded-[6px] shadow-[0_12px_28px_rgba(0,0,0,0.45)] py-1 z-30 max-h-60 overflow-y-auto'>
                {(organizations.length > 0
                  ? organizations
                  : [{ id: selectedOrgId || 'default', name: teamDisplayName }]
                ).map((org) => {
                  const isSelected = org.id === selectedOrgId;
                  return (
                    <button
                      key={org.id}
                      type='button'
                      onClick={() => {
                        setSelectedOrgId(org.id);
                        setShowTeamMenu(false);
                        if (org.id !== selectedOrgId) {
                          refreshGitHubState(org.id);
                        }
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-kr0n-surface-2 text-white font-medium'
                          : 'text-kr0n-text-secondary hover:text-white hover:bg-kr0n-surface-2/60'
                      }`}
                    >
                      <span className='truncate'>{org.name}</span>
                      {isSelected && <Check size={13} className='text-kr0n-accent shrink-0 ml-2' />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <label
              htmlFor='config-project-name'
              className='block text-xs font-medium text-kr0n-text-secondary'
            >
              Project name
            </label>
            <input
              id='config-project-name'
              type='text'
              maxLength={100}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder='my-app'
              className='w-full h-9 border border-kr0n-line bg-kr0n-canvas hover:border-kr0n-line-strong focus:border-kr0n-accent rounded-[6px] px-3 text-[13px] text-white outline-none transition-colors duration-150'
            />
          </div>
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <label
            htmlFor='config-description'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Description <span className='text-kr0n-muted font-normal'>(optional)</span>
          </label>
          <input
            id='config-description'
            type='text'
            maxLength={500}
            value={projectDescription}
            onChange={(e) => setProjectDescription?.(e.target.value)}
            placeholder='Short summary of this application'
            className='w-full h-9 border border-kr0n-line bg-kr0n-canvas hover:border-kr0n-line-strong focus:border-kr0n-accent rounded-[6px] px-3 text-[13px] text-white outline-none transition-colors duration-150'
          />
        </div>

        {/* Branch, Root Directory & Stack Preset */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-kr0n-line-soft'>
          <div className='space-y-1.5'>
            <label
              htmlFor='config-branch'
              className='block text-xs font-medium text-kr0n-text-secondary'
            >
              Production branch
            </label>
            <div className='flex items-center gap-1.5 border border-kr0n-line bg-kr0n-canvas rounded-[6px] px-2.5 h-9'>
              <GitBranch size={13} className='text-kr0n-muted shrink-0' />
              <select
                id='config-branch'
                value={selectedBranch}
                onChange={(e) => setSelectedBranch?.(e.target.value)}
                className='w-full bg-transparent text-xs font-mono text-white outline-none cursor-pointer'
              >
                {branchOptions.map((b) => (
                  <option key={b.name} value={b.name} className='bg-kr0n-black text-white'>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-kr0n-text-secondary'>Root directory</span>
              <button
                type='button'
                onClick={onOpenDirModal}
                className='text-xs text-kr0n-accent hover:underline cursor-pointer'
              >
                Browse
              </button>
            </div>
            <button
              type='button'
              onClick={onOpenDirModal}
              className='w-full h-9 border border-kr0n-line hover:border-kr0n-line-strong bg-kr0n-canvas rounded-[6px] px-2.5 flex items-center gap-2 text-xs font-mono text-white cursor-pointer transition-colors duration-150 truncate'
            >
              <Folder size={13} className='text-kr0n-muted shrink-0' />
              <span className='truncate'>{selectedDir || './'}</span>
            </button>
          </div>

          <div className='relative space-y-1.5' ref={presetMenuRef}>
            <label className='block text-xs font-medium text-kr0n-text-secondary'>
              Stack preset
            </label>
            <button
              type='button'
              onClick={() => setShowPresetMenu((prev) => !prev)}
              className='w-full h-9 border border-kr0n-line bg-kr0n-canvas hover:border-kr0n-line-strong rounded-[6px] px-2.5 flex items-center justify-between text-xs text-white transition-colors duration-150 cursor-pointer text-left'
            >
              <div className='flex items-center gap-2 min-w-0'>
                <RepoIcon type={currentPreset.id} />
                <span className='font-medium truncate'>{currentPreset.name}</span>
              </div>
              <ChevronDown
                size={13}
                className={`text-kr0n-muted transition-transform duration-150 shrink-0 ${
                  showPresetMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showPresetMenu && (
              <div className='absolute left-0 right-0 mt-1 border border-kr0n-line bg-kr0n-black rounded-[6px] shadow-[0_12px_28px_rgba(0,0,0,0.45)] py-1 z-30 max-h-72 overflow-y-auto'>
                {availablePresets.map((p) => {
                  const isSelected = p.id === presetId;
                  return (
                    <button
                      key={p.id}
                      type='button'
                      onClick={() => {
                        setPresetId(p.id);
                        setShowPresetMenu(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between transition-colors duration-150 text-left cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-kr0n-surface-2 text-white font-medium'
                          : 'text-kr0n-text-secondary hover:text-white hover:bg-kr0n-surface-2/60'
                      }`}
                    >
                      <div className='flex items-center gap-2 min-w-0'>
                        <RepoIcon type={p.id} />
                        <span className='truncate'>{p.name}</span>
                      </div>
                      {isSelected && <Check size={13} className='text-kr0n-accent shrink-0 ml-2' />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Optional Build Overrides Accordion */}
        <div className='border border-kr0n-line bg-kr0n-canvas rounded-[6px] overflow-hidden'>
          <button
            type='button'
            onClick={() => setExpandBuildSettings(!expandBuildSettings)}
            className='w-full px-4 h-10 flex items-center justify-between text-[13px] font-medium text-white hover:bg-kr0n-surface-2/50 transition-colors duration-150 cursor-pointer'
          >
            <div className='flex items-center gap-2'>
              <ChevronRight
                size={14}
                className={`text-kr0n-muted transition-transform duration-150 ${
                  expandBuildSettings ? 'rotate-90' : ''
                }`}
              />
              <span>Build and output overrides</span>
            </div>
            <span className='text-xs text-kr0n-muted font-normal'>Optional</span>
          </button>

          {expandBuildSettings && (
            <div className='p-4 border-t border-kr0n-line-soft space-y-4 bg-kr0n-black text-xs'>
              {[
                {
                  id: 'override-install',
                  label: 'Install command',
                  override: installOverride,
                  setOverride: setInstallOverride,
                  value: customInstallCommand,
                  setValue: setCustomInstallCommand,
                  fallback: currentPreset.installCommand || 'Leave empty to skip install step',
                  defaultText: currentPreset.installCommand || 'None',
                },
                {
                  id: 'override-build',
                  label: 'Build command',
                  override: buildOverride,
                  setOverride: setBuildOverride,
                  value: customBuildCommand,
                  setValue: setCustomBuildCommand,
                  fallback: currentPreset.buildCommand || 'Leave empty to skip build step',
                  defaultText: currentPreset.buildCommand || 'None',
                },
                {
                  id: 'override-output',
                  label: 'Output directory',
                  override: outputOverride,
                  setOverride: setOutputOverride,
                  value: customOutputDir,
                  setValue: setCustomOutputDir,
                  fallback: currentPreset.outputDir || 'Output directory',
                  defaultText: currentPreset.outputDir || 'None',
                },
              ].map((field) => (
                <div key={field.id} className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <label htmlFor={field.id} className='font-medium text-kr0n-text-secondary'>
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
                      }}
                      className={`text-xs pb-0.5 border-b transition-colors duration-150 cursor-pointer ${
                        field.override
                          ? 'border-kr0n-accent text-white font-medium'
                          : 'border-transparent text-kr0n-muted hover:text-white'
                      }`}
                    >
                      {field.override ? 'Custom override' : 'Use default'}
                    </button>
                  </div>
                  <input
                    id={field.id}
                    type='text'
                    disabled={!field.override}
                    value={field.override ? field.value : ''}
                    onChange={(e) => field.setValue(e.target.value)}
                    placeholder={field.override ? field.fallback : field.defaultText}
                    className='w-full h-9 rounded-[6px] border border-kr0n-line bg-kr0n-canvas focus:border-kr0n-accent px-3 text-xs font-mono text-white outline-none disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-150'
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon note for secrets */}
        <div className='border border-kr0n-line bg-kr0n-canvas rounded-[6px] px-4 py-2.5 flex items-center justify-between gap-3 text-xs'>
          <span className='inline-flex items-center gap-2 text-kr0n-muted'>
            <Lock size={13} />
            <span>Environment variables and secrets</span>
          </span>
          <span className='font-mono text-kr0n-faint'>Coming soon</span>
        </div>

        <button
          type='button'
          disabled={busy || !projectName.trim()}
          onClick={handleDeploy}
          className='w-full h-10 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black font-medium text-sm transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2'
        >
          {busy ? (
            <>
              <Loader2 size={15} className='animate-spin' />
              <span>Creating project...</span>
            </>
          ) : (
            <span>Create project</span>
          )}
        </button>
      </div>

      {/* Right: Live Project Summary Rail */}
      <aside className='lg:col-span-5 border border-kr0n-line bg-kr0n-black rounded-[6px] overflow-hidden'>
        <div className='px-5 h-11 border-b border-kr0n-line-soft flex items-center justify-between text-xs'>
          <span className='font-semibold text-white'>Project summary</span>
          <span className='font-mono text-kr0n-muted'>rev 1</span>
        </div>

        <div className='p-5 space-y-4'>
          <div className='flex items-center gap-2.5'>
            <GithubIcon className='w-4 h-4 text-kr0n-text shrink-0' />
            <span className='font-mono text-[13px] font-medium text-white truncate'>
              {selectedRepo.full_name || `${accountLogin}/${selectedRepo.name}`}
            </span>
          </div>

          <dl className='divide-y divide-kr0n-line-soft border-t border-kr0n-line-soft text-xs'>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Organization</dt>
              <dd className='text-white font-medium truncate'>{teamDisplayName}</dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Project name</dt>
              <dd className='font-mono text-white truncate'>{projectName || '—'}</dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Branch</dt>
              <dd className='font-mono text-kr0n-text-secondary'>{selectedBranch}</dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Root directory</dt>
              <dd className='font-mono text-kr0n-text-secondary'>{selectedDir || './'}</dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Preset</dt>
              <dd className='text-white'>{currentPreset.name}</dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Install</dt>
              <dd className='font-mono text-kr0n-text-secondary truncate max-w-[200px]'>
                {effectiveInstall}
              </dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Build</dt>
              <dd className='font-mono text-kr0n-text-secondary truncate max-w-[200px]'>
                {effectiveBuild}
              </dd>
            </div>
            <div className='py-2.5 flex items-center justify-between gap-3'>
              <dt className='text-kr0n-muted'>Output</dt>
              <dd className='font-mono text-kr0n-text-secondary truncate max-w-[200px]'>
                {effectiveOutput}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
