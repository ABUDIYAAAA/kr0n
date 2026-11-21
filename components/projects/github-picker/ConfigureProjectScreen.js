'use client';

import {
  ArrowLeft,
  GitBranch,
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { APPLICATION_PRESETS, RepoIcon } from './constants';

export default function ConfigureProjectScreen({
  selectedRepo,
  accountLogin,
  selectedBranch,
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
  selectedDir,
  onOpenDirModal,
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
  expandEnvVars,
  setExpandEnvVars,
  envVars,
  setEnvVars,
  envKey,
  setEnvKey,
  envVal,
  setEnvVal,
  handleAddEnvVar,
  busy,
  handleDeploy,
}) {
  return (
    <div className="w-full max-w-2xl border border-[#222222] bg-[#0c0c0c] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header Title with Back button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">New Project</h2>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      {/* Importing From GitHub Box */}
      <div className="border border-[#222222] bg-[#121212] rounded-lg p-3.5 space-y-1">
        <p className="text-xs text-neutral-400">Importing from GitHub</p>
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            className="text-white shrink-0"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span className="font-semibold text-sm text-white">
            {selectedRepo.full_name || `${accountLogin}/${selectedRepo.name}`}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-mono ml-1">
            <GitBranch size={13} /> {selectedBranch}
          </span>
        </div>
      </div>

      <p className="text-sm text-neutral-300">
        Choose where you want to create the project and give it a name.
      </p>

      {/* Team / Workspace & Project Name Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Vercel Team / Workspace Dropdown */}
        <div className="relative" ref={teamMenuRef}>
          <label className="block text-xs text-neutral-400 font-medium mb-1.5">
            Team
          </label>
          <button
            type="button"
            onClick={() => setShowTeamMenu((prev) => !prev)}
            className="w-full border border-[#222222] bg-[#121212] hover:border-[#333333] rounded-md px-3 py-2 flex items-center justify-between text-sm text-white transition-colors cursor-pointer text-left focus:outline-none focus:border-neutral-500"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate text-xs font-medium">{teamDisplayName}</span>

            </div>
            <ChevronDown
              size={14}
              className={`text-neutral-400 shrink-0 ml-1 transition-transform duration-150 ${showTeamMenu ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showTeamMenu && (
            <div className="absolute left-0 right-0 mt-1.5 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 max-h-60 overflow-y-auto divide-y divide-[#181818]">
              <div className="px-3 py-1.5 text-neutral-400 font-mono text-[10px] uppercase">
                Select Team Workspace
              </div>
              {(organizations.length > 0
                ? organizations
                : [{ id: selectedOrgId || 'default', name: teamDisplayName }]
              ).map((org) => {
                const isSelected = org.id === selectedOrgId;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrgId(org.id);
                      setShowTeamMenu(false);
                      if (org.id !== selectedOrgId) {
                        refreshGitHubState(org.id);
                      }
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between transition-colors text-left cursor-pointer ${isSelected
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-neutral-600'
                          }`}
                      />
                      <span className="text-xs truncate">{org.name}</span>

                    </div>
                    {isSelected && <Check size={13} className="text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Separator Slash */}
        <span className="text-neutral-500 font-mono text-lg hidden sm:block pt-5 text-center">
          /
        </span>

        {/* Project Name */}
        <div>
          <label className="block text-xs text-neutral-400 font-medium mb-1.5">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="my-app"
            className="w-full border border-[#222222] bg-[#121212] rounded-md px-3 py-2 text-sm text-white outline-none focus:border-[#444444] transition-colors"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1c1c1c]" />

      {/* Root Directory & Application Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Root Directory */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-400 font-medium">
              Root Directory
            </label>
            <button
              type="button"
              onClick={onOpenDirModal}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors"
            >
              Edit / Browse Map
            </button>
          </div>
          <div
            onClick={onOpenDirModal}
            className="border border-[#222222] hover:border-[#333333] bg-[#121212] rounded-md px-3 py-2 flex items-center justify-between text-sm text-white cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 truncate">
              <Folder size={14} className="text-neutral-400 group-hover:text-white shrink-0 transition-colors" />
              <span className="font-mono text-xs text-white truncate">
                {selectedDir || './'}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 shrink-0 font-sans">
              Select
            </span>
          </div>
        </div>

        {/* Application Preset */}
        <div className="relative" ref={presetMenuRef}>
          <label className="block text-xs text-neutral-400 font-medium mb-1.5">
            Application Preset
          </label>
          <button
            type="button"
            onClick={() => setShowPresetMenu((prev) => !prev)}
            className="w-full border border-[#222222] bg-[#121212] hover:border-[#333333] rounded-md px-3 py-2 flex items-center justify-between text-sm text-white transition-colors cursor-pointer text-left focus:outline-none focus:border-neutral-500"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <RepoIcon type={currentPreset.id} />
              <span className="font-medium text-sm text-white truncate">{currentPreset.name}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-neutral-400 transition-transform duration-150 shrink-0 ${showPresetMenu ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showPresetMenu && (
            <div className="absolute left-0 right-0 mt-1.5 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 max-h-72 overflow-y-auto divide-y divide-[#181818]">
              {APPLICATION_PRESETS.map((p) => {
                const isSelected = p.id === presetId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPresetId(p.id);
                      setShowPresetMenu(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.08] text-white font-medium'
                        : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RepoIcon type={p.id} />
                      <span className="text-sm truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {p.category && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                          {p.category}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-white shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Accordion 1: Build and Output Settings */}
      <div className="border border-[#222222] bg-[#121212] rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandBuildSettings(!expandBuildSettings)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ChevronRight
              size={14}
              className={`text-neutral-400 transition-transform ${expandBuildSettings ? 'rotate-90' : ''
                }`}
            />
            <span>Build and Output Settings</span>
          </div>
        </button>

        {expandBuildSettings && (
          <div className="p-4 border-t border-[#1c1c1c] space-y-4 bg-black/40 text-xs">
            {/* Build Command */}
            <div className="space-y-1.5">
              <label className="block text-neutral-400 font-mono">Build Command</label>
              <div
                className={`relative flex items-center border rounded transition-colors ${
                  buildOverride
                    ? 'border-[#383838] bg-[#121212] focus-within:border-white/50'
                    : 'border-[#222222] bg-[#0d0d0d]'
                }`}
              >
                <input
                  type="text"
                  disabled={!buildOverride}
                  value={buildOverride ? customBuildCommand : ''}
                  onChange={(e) => setCustomBuildCommand(e.target.value)}
                  placeholder={
                    buildOverride
                      ? (currentPreset.buildCommand || 'No build command')
                      : (currentPreset.buildCommand || 'None')
                  }
                  className={`flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-none placeholder:text-neutral-600 disabled:cursor-not-allowed ${
                    buildOverride ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                <div className="pr-2.5 flex items-center shrink-0 select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={buildOverride}
                    onClick={() => {
                      const next = !buildOverride;
                      setBuildOverride(next);
                      if (!next) {
                        setCustomBuildCommand('');
                      }
                    }}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      buildOverride ? 'bg-white' : 'bg-neutral-800 border border-neutral-700'
                    }`}
                    title={buildOverride ? 'Disable override' : 'Enable override'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                        buildOverride ? 'translate-x-3 bg-black' : 'translate-x-0 bg-neutral-500'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Output Directory */}
            <div className="space-y-1.5">
              <label className="block text-neutral-400 font-mono">Output Directory</label>
              <div
                className={`relative flex items-center border rounded transition-colors ${
                  outputOverride
                    ? 'border-[#383838] bg-[#121212] focus-within:border-white/50'
                    : 'border-[#222222] bg-[#0d0d0d]'
                }`}
              >
                <input
                  type="text"
                  disabled={!outputOverride}
                  value={outputOverride ? customOutputDir : ''}
                  onChange={(e) => setCustomOutputDir(e.target.value)}
                  placeholder={
                    outputOverride
                      ? (currentPreset.outputDir || 'Output directory')
                      : (currentPreset.outputDir || 'None')
                  }
                  className={`flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-none placeholder:text-neutral-600 disabled:cursor-not-allowed ${
                    outputOverride ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                <div className="pr-2.5 flex items-center shrink-0 select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={outputOverride}
                    onClick={() => {
                      const next = !outputOverride;
                      setOutputOverride(next);
                      if (!next) {
                        setCustomOutputDir('');
                      }
                    }}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      outputOverride ? 'bg-white' : 'bg-neutral-800 border border-neutral-700'
                    }`}
                    title={outputOverride ? 'Disable override' : 'Enable override'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                        outputOverride ? 'translate-x-3 bg-black' : 'translate-x-0 bg-neutral-500'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Install Command */}
            <div className="space-y-1.5">
              <label className="block text-neutral-400 font-mono">Install Command</label>
              <div
                className={`relative flex items-center border rounded transition-colors ${
                  installOverride
                    ? 'border-[#383838] bg-[#121212] focus-within:border-white/50'
                    : 'border-[#222222] bg-[#0d0d0d]'
                }`}
              >
                <input
                  type="text"
                  disabled={!installOverride}
                  value={installOverride ? customInstallCommand : ''}
                  onChange={(e) => setCustomInstallCommand(e.target.value)}
                  placeholder={
                    installOverride
                      ? (currentPreset.installCommand || 'No install command')
                      : (currentPreset.installCommand || 'None')
                  }
                  className={`flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-none placeholder:text-neutral-600 disabled:cursor-not-allowed ${
                    installOverride ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                <div className="pr-2.5 flex items-center shrink-0 select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={installOverride}
                    onClick={() => {
                      const next = !installOverride;
                      setInstallOverride(next);
                      if (!next) {
                        setCustomInstallCommand('');
                      }
                    }}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      installOverride ? 'bg-white' : 'bg-neutral-800 border border-neutral-700'
                    }`}
                    title={installOverride ? 'Disable override' : 'Enable override'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                        installOverride ? 'translate-x-3 bg-black' : 'translate-x-0 bg-neutral-500'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: Environment Variables */}
      <div className="border border-[#222222] bg-[#121212] rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandEnvVars(!expandEnvVars)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ChevronRight
              size={14}
              className={`text-neutral-400 transition-transform ${expandEnvVars ? 'rotate-90' : ''
                }`}
            />
            <span>
              Environment Variables {envVars.length > 0 ? `(${envVars.length})` : ''}
            </span>
          </div>
        </button>

        {expandEnvVars && (
          <div className="p-4 border-t border-[#1c1c1c] space-y-3 bg-black/40 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="KEY"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                className="flex-1 border border-[#222222] bg-[#121212] rounded p-2 text-xs text-white font-mono outline-none"
              />
              <input
                type="text"
                placeholder="VALUE"
                value={envVal}
                onChange={(e) => setEnvVal(e.target.value)}
                className="flex-1 border border-[#222222] bg-[#121212] rounded p-2 text-xs text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleAddEnvVar}
                className="bg-white text-black font-semibold px-4 py-1.5 rounded text-xs hover:bg-neutral-200"
              >
                <Plus size={12} className="inline mr-1" /> Add
              </button>
            </div>

            {envVars.length > 0 && (
              <div className="border border-[#222222] rounded divide-y divide-[#1c1c1c] mt-2">
                {envVars.map((v) => (
                  <div
                    key={v.key}
                    className="p-2 flex items-center justify-between font-mono text-xs"
                  >
                    <span className="text-white font-semibold">{v.key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">••••••••</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEnvVars((prev) => prev.filter((item) => item.key !== v.key))
                        }
                        className="text-neutral-400 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Width White Deploy Button */}
      <button
        type="button"
        disabled={busy || !projectName.trim()}
        onClick={handleDeploy}
        className="w-full bg-white text-black font-semibold py-2.5 rounded-md hover:bg-neutral-200 active:scale-[0.99] transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Layers size={15} className="animate-spin" />
            <span>Deploying…</span>
          </>
        ) : (
          <>
            <Sparkles size={15} />
            <span>Deploy</span>
          </>
        )}
      </button>
    </div>
  );
}
