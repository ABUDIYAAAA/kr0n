'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowLeft,
  Lock,
  GitBranch,
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { githubApi } from '@/lib/github-api';
import { getOrganizations, getMe, getStoredUser } from '@/lib/auth';
import { useKr0nStore } from '@/lib/kr0n-state';

// Framework preset definitions
const APPLICATION_PRESETS = [
  {
    id: 'vite',
    name: 'Vite',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm install',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    buildCommand: 'npm run build',
    outputDir: '.next',
    installCommand: 'npm install',
  },
  {
    id: 'remix',
    name: 'Remix',
    buildCommand: 'npm run build',
    outputDir: 'build',
    installCommand: 'npm install',
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    buildCommand: 'npm run build',
    outputDir: '.output',
    installCommand: 'npm install',
  },
  {
    id: 'react',
    name: 'React (CRA)',
    buildCommand: 'npm run build',
    outputDir: 'build',
    installCommand: 'npm install',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm install',
  },
  {
    id: 'python',
    name: 'Python',
    buildCommand: 'pip install -r requirements.txt',
    outputDir: '.',
    installCommand: 'pip install -r requirements.txt',
  },
  {
    id: 'other',
    name: 'Other',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm install',
  },
];

// Helper to render framework / repo icon
function RepoIcon({ type, name = '' }) {
  const lower = (type || name).toLowerCase();
  if (lower.includes('vite') || lower.includes('isharu')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/40 text-purple-300">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M12 2L2 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('next') || lower.includes('damru')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 border border-white/30 text-white">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M12 3L22 21H2L12 3z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-700 text-neutral-300">
      <GitBranch size={11} />
    </div>
  );
}

export default function GitHubProjectPicker() {
  const router = useRouter();
  const { addProject } = useKr0nStore();

  // Navigation steps: 'select' (Screen 1) | 'configure' (Screen 2)
  const [step, setStep] = useState('select');

  // User & Organization State
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  // Repositories State
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [directories, setDirectories] = useState(['./']);
  const [selectedDir, setSelectedDir] = useState('./');

  // Search Filter
  const [search, setSearch] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Connect / Install GitHub App via backend
  async function connectGitHubApp() {
    if (!selectedOrgId) return;
    try {
      const data = await githubApi(`orgs/${selectedOrgId}/github/installations/start`);
      if (data?.install_url) {
        sessionStorage.setItem('kr0n_github_install', JSON.stringify({ org: selectedOrgId, state: data.state }));
        window.location.assign(data.install_url);
      }
    } catch (err) {
      console.warn('[kr0n] Failed to start GitHub App installation:', err?.message);
    }
  }

  // Configuration Form State (Screen 2)
  const [projectName, setProjectName] = useState('');
  const [presetId, setPresetId] = useState('vite');
  const [expandBuildSettings, setExpandBuildSettings] = useState(false);
  const [buildOverride, setBuildOverride] = useState(false);
  const [customBuildCommand, setCustomBuildCommand] = useState('');
  const [outputOverride, setOutputOverride] = useState(false);
  const [customOutputDir, setCustomOutputDir] = useState('');
  const [installOverride, setInstallOverride] = useState(false);
  const [customInstallCommand, setCustomInstallCommand] = useState('');

  // Environment Variables
  const [expandEnvVars, setExpandEnvVars] = useState(false);
  const [envVars, setEnvVars] = useState([]);
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');

  // Status & Loaders
  const [busy, setBusy] = useState(false);

  // ─── 1. INITIALIZE USER & WORKSPACE ─────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await getMe();
        if (!active) return;
        if (me) {
          setCurrentUser(me);
        }
        const orgList = await getOrganizations();
        if (!active) return;
        if (orgList && orgList.length > 0) {
          setOrganizations(orgList);
          setSelectedOrgId(orgList[0].id);
        }
      } catch (err) {
        console.warn('[kr0n] Workspace init error:', err?.message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ─── 2. FETCH REPOSITORIES FROM GITHUB / BACKEND ─────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      const defaultUserLogin = currentUser?.displayName || currentUser?.display_name || 'arpittripathi755';
      const fallbackRepos = [
        {
          id: 'repo-damru-26',
          name: 'Damru-26',
          owner: defaultUserLogin,
          full_name: `${defaultUserLogin}/Damru-26`,
          private: true,
          default_branch: 'main',
          updatedDate: 'Nov 9',
          type: 'nextjs',
        },
        {
          id: 'repo-isharu',
          name: 'Isharu',
          owner: defaultUserLogin,
          full_name: `${defaultUserLogin}/Isharu`,
          private: true,
          default_branch: 'main',
          updatedDate: 'Nov 4',
          type: 'vite',
        },
        {
          id: 'repo-ship-safe',
          name: 'Ship-Safe',
          owner: defaultUserLogin,
          full_name: `${defaultUserLogin}/Ship-Safe`,
          private: true,
          default_branch: 'main',
          updatedDate: 'Nov 4',
          type: 'react',
        },
      ];

      try {
        if (selectedOrgId) {
          const instData = await githubApi(`orgs/${selectedOrgId}/github/installations`).catch(() => ({}));
          const installations = instData?.installations || [];
          if (installations.length > 0) {
            const instId = installations[0].installation_id;
            const repoData = await githubApi(
              `orgs/${selectedOrgId}/github/repositories?installation_id=${instId}`
            ).catch(() => ({}));
            const apiRepos = repoData?.repositories || [];
            if (active && apiRepos.length > 0) {
              setRepos(
                apiRepos.map((r, idx) => ({
                  ...r,
                  updatedDate: r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Nov ${idx + 4}`,
                }))
              );
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[kr0n] Failed to fetch backend repos, using user repo list:', err?.message);
      }

      if (active) {
        setRepos(fallbackRepos);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedOrgId, currentUser]);

  // ─── 3. FETCH REPO BRANCHES & DIRECTORIES ON SELECTION ──────────────
  useEffect(() => {
    if (!selectedRepo || !selectedOrgId) return;
    let active = true;

    githubApi(
      `orgs/${selectedOrgId}/github/repositories/${encodeURIComponent(selectedRepo.owner)}/${encodeURIComponent(selectedRepo.name)}/branches`
    )
      .then((data) => {
        if (!active) return;
        const list = data?.branches || [];
        if (list.length > 0) {
          setBranches(list);
          const foundDefault = list.find((b) => b.name === selectedRepo.default_branch);
          setSelectedBranch(foundDefault ? foundDefault.name : list[0].name);
        }
      })
      .catch(() => {
        if (active) {
          setBranches([{ name: selectedRepo.default_branch || 'main' }]);
          setSelectedBranch(selectedRepo.default_branch || 'main');
        }
      });

    githubApi(
      `orgs/${selectedOrgId}/github/repositories/${encodeURIComponent(selectedRepo.owner)}/${encodeURIComponent(selectedRepo.name)}/directories?ref=${selectedBranch}`
    )
      .then((data) => {
        if (!active) return;
        const dirs = data?.directories || [];
        if (dirs.length > 0) {
          setDirectories(dirs.map((d) => (d === '/' ? './' : d)));
          setSelectedDir('./');
        }
      })
      .catch(() => {
        if (active) {
          setDirectories(['./']);
          setSelectedDir('./');
        }
      });

    return () => {
      active = false;
    };
  }, [selectedRepo, selectedOrgId, selectedBranch]);

  // Handle clicking "Import" on a repository (transitions to Screen 2)
  function handleSelectRepo(r) {
    setSelectedRepo(r);
    // Project name suggestion e.g. isharu-ikng or isharu
    const cleanName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setProjectName(cleanName);
    setSelectedBranch(r.default_branch || 'main');
    setSelectedDir('./');

    // Preset auto-detection
    const lowerName = r.name.toLowerCase();
    if (lowerName.includes('next') || lowerName.includes('damru')) {
      setPresetId('nextjs');
    } else if (lowerName.includes('vite') || lowerName.includes('isharu')) {
      setPresetId('vite');
    } else if (lowerName.includes('remix')) {
      setPresetId('remix');
    } else if (lowerName.includes('nuxt')) {
      setPresetId('nuxt');
    } else {
      setPresetId('vite');
    }

    setStep('configure');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle adding an environment variable
  function handleAddEnvVar() {
    if (!envKey.trim()) return;
    setEnvVars((prev) => [
      ...prev.filter((v) => v.key !== envKey.trim()),
      { key: envKey.trim(), value: envVal },
    ]);
    setEnvKey('');
    setEnvVal('');
  }

  // Handle deploying the project
  async function handleDeploy() {
    if (!projectName.trim()) return;
    setBusy(true);

    const activePreset = APPLICATION_PRESETS.find((p) => p.id === presetId) || APPLICATION_PRESETS[0];
    const buildCmd = buildOverride && customBuildCommand.trim() ? customBuildCommand.trim() : activePreset.buildCommand;
    const outDir = outputOverride && customOutputDir.trim() ? customOutputDir.trim() : activePreset.outputDir;
    const instCmd = installOverride && customInstallCommand.trim() ? customInstallCommand.trim() : activePreset.installCommand;

    try {
      const newProj = addProject({
        name: projectName.trim(),
        repository: selectedRepo?.full_name || `${accountLogin}/${selectedRepo?.name || projectName.trim()}`,
        branch: selectedBranch || 'main',
        rootDir: selectedDir || './',
        runtime: activePreset.name,
        runtimeLabel: `${activePreset.name} Application`,
        buildCommand: buildCmd,
        outputDir: outDir,
        installCommand: instCmd,
        envVars,
        environment: 'production',
      });

      // Navigate to project detail view
      router.push(`/projects/${newProj.id}`);
    } catch (err) {
      console.error('[kr0n] Deploy failed:', err);
      setBusy(false);
    }
  }

  const accountLogin =
    currentUser?.displayName || currentUser?.display_name || currentUser?.name || 'arpittripathi755';
  const teamDisplayName =
    organizations.find((o) => o.id === selectedOrgId)?.name || `${accountLogin}-4325's ...`;

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const currentPreset = APPLICATION_PRESETS.find((p) => p.id === presetId) || APPLICATION_PRESETS[0];

  return (
    <main className="min-h-screen bg-[#000000] text-white flex flex-col justify-start items-center p-6 sm:p-12 font-sans selection:bg-white selection:text-black">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: IMPORT GIT REPOSITORY (IMAGE 1)                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'select' && (
        <div className="w-full max-w-3xl space-y-5">
          {/* Header Title */}
          <h1 className="text-2xl font-bold tracking-tight text-white">Import Git Repository</h1>

          {/* Account Selector & Search Bar Row */}
          <div className="flex items-center gap-3">
            {/* Account Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 bg-[#0c0c0c] border border-[#222222] hover:border-[#333333] rounded-md px-3 py-2 text-sm text-neutral-200 shrink-0 cursor-pointer transition-colors"
              >
                {currentUser?.avatarUrl || currentUser?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl || currentUser.avatar_url}
                    alt={accountLogin}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {accountLogin[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <span className="font-medium text-sm text-white">{accountLogin}</span>
                <ChevronDown size={14} className="text-neutral-400 ml-1" />
              </button>

              {showAccountMenu && (
                <div className="absolute left-0 mt-1.5 w-60 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 text-xs">
                  <div className="px-3 py-1.5 text-neutral-400 font-mono text-[10px] uppercase">Active Account</div>
                  <div className="px-3 py-1.5 flex items-center justify-between text-white font-medium">
                    <span className="truncate">{accountLogin}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                  </div>
                  <div className="border-t border-[#1c1c1c] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      connectGitHubApp();
                    }}
                    className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <GitBranch size={13} /> Link / Install GitHub App
                  </button>
                </div>
              )}
            </div>

            {/* Search Input Box */}
            <div className="flex-1 flex items-center gap-2.5 bg-[#0c0c0c] border border-[#222222] focus-within:border-[#444444] rounded-md px-3.5 py-2 text-sm text-white transition-colors">
              <Search size={15} className="text-neutral-500 shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Repository List Box */}
          <div className="border border-[#222222] bg-[#0c0c0c] rounded-lg divide-y divide-[#1c1c1c] overflow-hidden">
            {filteredRepos.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No repositories found matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredRepos.map((r) => (
                <div
                  key={r.id || r.name}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  {/* Left: Icon + Name + Lock + Date */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RepoIcon type={r.type} name={r.name} />
                    <span className="font-medium text-sm text-white">{r.name}</span>
                    {r.private && <Lock size={12} className="text-neutral-400 shrink-0 ml-0.5" />}
                    <span className="text-neutral-400 text-sm shrink-0">· {r.updatedDate || 'Nov 4'}</span>
                  </div>

                  {/* Right: White Import Button */}
                  <button
                    onClick={() => handleSelectRepo(r)}
                    className="bg-white text-black font-semibold text-sm px-5 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
                  >
                    Import
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: CONFIGURE & DEPLOY NEW PROJECT (IMAGE 2)                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'configure' && selectedRepo && (
        <div className="w-full max-w-2xl border border-[#222222] bg-[#0c0c0c] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header Title with Back button */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-white">New Project</h2>
            <button
              onClick={() => setStep('select')}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Back
            </button>
          </div>

          {/* Importing From GitHub Box */}
          <div className="border border-[#222222] bg-[#121212] rounded-lg p-3.5 space-y-1">
            <p className="text-xs text-neutral-400">Importing from GitHub</p>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-white shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="font-semibold text-sm text-white">
                {selectedRepo.full_name || `${accountLogin}/${selectedRepo.name}`}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-mono ml-1">
                <GitBranch size={13} /> {selectedBranch}
              </span>
            </div>
          </div>

          <p className="text-sm text-neutral-300">Choose where you want to create the project and give it a name.</p>

          {/* Team / Workspace & Project Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* Vercel Team / Workspace */}
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">Vercel Team</label>
              <div className="border border-[#222222] bg-[#121212] rounded-md px-3 py-2 flex items-center justify-between text-sm text-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate text-xs font-medium">{teamDisplayName}</span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                    Hobby
                  </span>
                </div>
                <ChevronDown size={14} className="text-neutral-400 shrink-0 ml-1" />
              </div>
            </div>

            {/* Separator Slash */}
            <span className="text-neutral-500 font-mono text-lg hidden sm:block pt-5 text-center">/</span>

            {/* Project Name */}
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="isharu-ikng"
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
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">Root Directory</label>
              <div className="border border-[#222222] bg-[#121212] rounded-md px-3 py-2 flex items-center gap-2 text-sm text-white">
                <Folder size={14} className="text-neutral-400 shrink-0" />
                <select
                  value={selectedDir}
                  onChange={(e) => setSelectedDir(e.target.value)}
                  className="bg-transparent w-full text-sm outline-none text-white cursor-pointer"
                >
                  {directories.map((d) => (
                    <option key={d} value={d} className="bg-[#121212] text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Application Preset */}
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">Application Preset</label>
              <div className="border border-[#222222] bg-[#121212] rounded-md px-3 py-2 flex items-center justify-between text-sm text-white">
                <div className="flex items-center gap-2">
                  <RepoIcon type={currentPreset.id} />
                  <select
                    value={presetId}
                    onChange={(e) => setPresetId(e.target.value)}
                    className="bg-transparent text-sm outline-none text-white cursor-pointer"
                  >
                    {APPLICATION_PRESETS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#121212] text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDown size={14} className="text-neutral-400 pointer-events-none" />
              </div>
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
                  className={`text-neutral-400 transition-transform ${expandBuildSettings ? 'rotate-90' : ''}`}
                />
                <span>Build and Output Settings</span>
              </div>
            </button>

            {expandBuildSettings && (
              <div className="p-4 border-t border-[#1c1c1c] space-y-4 bg-black/40 text-xs">
                {/* Build Command */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-mono">Build Command</span>
                    <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={buildOverride}
                        onChange={(e) => setBuildOverride(e.target.checked)}
                        className="rounded"
                      />
                      Override
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!buildOverride}
                    value={buildOverride ? customBuildCommand : currentPreset.buildCommand}
                    onChange={(e) => setCustomBuildCommand(e.target.value)}
                    placeholder={currentPreset.buildCommand}
                    className="w-full border border-[#222222] bg-[#121212] rounded p-2 text-xs text-white outline-none disabled:opacity-50"
                  />
                </div>

                {/* Output Directory */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-mono">Output Directory</span>
                    <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={outputOverride}
                        onChange={(e) => setOutputOverride(e.target.checked)}
                        className="rounded"
                      />
                      Override
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!outputOverride}
                    value={outputOverride ? customOutputDir : currentPreset.outputDir}
                    onChange={(e) => setCustomOutputDir(e.target.value)}
                    placeholder={currentPreset.outputDir}
                    className="w-full border border-[#222222] bg-[#121212] rounded p-2 text-xs text-white outline-none disabled:opacity-50"
                  />
                </div>

                {/* Install Command */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-mono">Install Command</span>
                    <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={installOverride}
                        onChange={(e) => setInstallOverride(e.target.checked)}
                        className="rounded"
                      />
                      Override
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!installOverride}
                    value={installOverride ? customInstallCommand : currentPreset.installCommand}
                    onChange={(e) => setCustomInstallCommand(e.target.value)}
                    placeholder={currentPreset.installCommand}
                    className="w-full border border-[#222222] bg-[#121212] rounded p-2 text-xs text-white outline-none disabled:opacity-50"
                  />
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
                  className={`text-neutral-400 transition-transform ${expandEnvVars ? 'rotate-90' : ''}`}
                />
                <span>Environment Variables {envVars.length > 0 ? `(${envVars.length})` : ''}</span>
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
                      <div key={v.key} className="p-2 flex items-center justify-between font-mono text-xs">
                        <span className="text-white font-semibold">{v.key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">••••••••</span>
                          <button
                            type="button"
                            onClick={() => setEnvVars((prev) => prev.filter((item) => item.key !== v.key))}
                            className="text-neutral-400 hover:text-red-400"
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
      )}
    </main>
  );
}
