'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { githubApi } from '@/lib/github-api';
import {
  getOrganizations,
  createOrganization,
  getMe,
  useAuthUser,
} from '@/lib/auth';
import { useKr0nStore } from '@/lib/kr0n-state';

import {
  APPLICATION_PRESETS,
  getRepoTimestamp,
  formatLastModified,
  detectPresetSynchronously,
} from './github-picker/constants';
import DirectoryMapModal from './github-picker/DirectoryMapModal';
import GitHubNotConnected from './github-picker/GitHubNotConnected';
import RepoListScreen from './github-picker/RepoListScreen';
import ConfigureProjectScreen from './github-picker/ConfigureProjectScreen';

export default function GitHubProjectPicker() {
  const router = useRouter();
  const { addProject } = useKr0nStore();

  // Navigation steps: 'select' (Screen 1) | 'configure' (Screen 2)
  const [step, setStep] = useState('select');

  // User & Organization State
  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  // GitHub Connection & Installation State
  const [loading, setLoading] = useState(true);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [installations, setInstallations] = useState([]);
  const [activeInstallation, setActiveInstallation] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

  // Repositories State (ONLY REAL REPOSITORIES FROM GITHUB)
  const [repos, setRepos] = useState([]);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [directories, setDirectories] = useState(['./']);
  const [dirEntries, setDirEntries] = useState([]);
  const [dirTreeRoot, setDirTreeRoot] = useState(null);
  const [selectedDir, setSelectedDir] = useState('./');
  const [isDirModalOpen, setIsDirModalOpen] = useState(false);

  // Manual installation ID input fallback (e.g. if GitHub Setup URL did not auto-redirect)
  const [manualInstallId, setManualInstallId] = useState('');

  // Search Filter & Account Dropdown
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  // Configuration Form State (Screen 2)
  const [projectName, setProjectName] = useState('');
  const [presetId, setPresetId] = useState('vite');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const presetMenuRef = useRef(null);
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const teamMenuRef = useRef(null);
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

  // Deployment action status
  const [busy, setBusy] = useState(false);

  // Derived Account details
  const accountLogin =
    activeInstallation?.account_login ||
    currentUser?.displayName ||
    currentUser?.display_name ||
    currentUser?.email?.split('@')[0] ||
    'Developer';

  const accountEmail = currentUser?.email || '';

  // ─── 1. INITIALIZE WORKSPACE & CHECK GITHUB STATUS ──────────────────
  const refreshGitHubState = useCallback(async (orgId) => {
    if (!orgId) {
      setIsGitHubConnected(false);
      setRepos([]);
      setLoading(false);
      return;
    }

    try {
      const instData = await githubApi(`orgs/${orgId}/github/installations`).catch(() => ({}));
      const instList = instData?.installations || [];
      setInstallations(instList);

      if (instList.length > 0) {
        setIsGitHubConnected(true);
        const inst = instList[0];
        setActiveInstallation(inst);
        setFetchingRepos(true);

        try {
          // Fetch real repositories from GitHub
          const repoData = await githubApi(
            `orgs/${orgId}/github/repositories?installation_id=${inst.installation_id}`
          );

          const apiRepos = repoData?.repositories || [];
          const sorted = [...apiRepos].sort((a, b) => {
            const timeA = getRepoTimestamp(a);
            const timeB = getRepoTimestamp(b);
            if (timeB !== timeA) return timeB - timeA;
            return (a.name || '').localeCompare(b.name || '');
          });
          setRepos(
            sorted.map((r) => ({
              ...r,
              updatedDate: formatLastModified(r),
            }))
          );
        } catch (err) {
          console.warn('[kr0n] Failed to fetch repositories (app uninstalled or invalid token):', err?.message);
          // Auto-recover: if the app was uninstalled on GitHub, reset connection to prompt reconnect
          setIsGitHubConnected(false);
          setActiveInstallation(null);
          setInstallations([]);
          setRepos([]);
        } finally {
          setFetchingRepos(false);
        }
      } else {
        setIsGitHubConnected(false);
        setRepos([]);
      }
    } catch (err) {
      console.warn('[kr0n] GitHub status check error:', err?.message);
      setIsGitHubConnected(false);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await getMe().catch(() => null);
        if (active && me) setLiveUser(me);

        // Fetch organizations
        let orgList = await getOrganizations().catch(() => []);

        // If no organization exists for user, auto-create a default workspace
        if (active && (!orgList || orgList.length === 0)) {
          const defaultName = (me?.displayName || me?.display_name || 'My Workspace').trim();
          const created = await createOrganization(defaultName).catch(() => null);
          if (created) {
            orgList = [created.organization || created];
          }
        }

        if (active && orgList && orgList.length > 0) {
          setOrganizations(orgList);
          const firstOrgId = orgList[0].id;
          setSelectedOrgId(firstOrgId);
          await refreshGitHubState(firstOrgId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn('[kr0n] Workspace init error:', err?.message);
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshGitHubState]);

  // ─── 2. CONNECT / INSTALL GITHUB APP ────────────────────────────────
  async function connectGitHubApp() {
    setConnecting(true);
    setConnectError(null);

    try {
      let orgId = selectedOrgId;

      // Ensure organization is ready
      if (!orgId) {
        let orgList = await getOrganizations().catch(() => []);
        if (!orgList || orgList.length === 0) {
          const defaultName = (currentUser?.displayName || currentUser?.display_name || 'My Workspace').trim();
          const created = await createOrganization(defaultName).catch(() => null);
          if (created) {
            orgList = [created.organization || created];
          }
        }
        if (orgList && orgList.length > 0) {
          orgId = orgList[0].id;
          setSelectedOrgId(orgId);
          setOrganizations(orgList);
        }
      }

      if (!orgId) {
        throw new Error('Workspace initialization is taking longer than expected. Please try again.');
      }

      // Initiate installation via backend
      const data = await githubApi(`orgs/${orgId}/github/installations/start`);
      if (data?.install_url) {
        const installMeta = JSON.stringify({ org: orgId, state: data.state });
        sessionStorage.setItem('kr0n_github_install', installMeta);
        localStorage.setItem('kr0n_github_install', installMeta);
        window.location.assign(data.install_url);
        return;
      }

      throw new Error(data?.error || 'No installation URL returned by GitHub gateway.');
    } catch (err) {
      console.error('[kr0n] Failed to connect GitHub:', err);
      setConnectError(err.message || 'Unable to start GitHub connection.');
      setConnecting(false);
    }
  }

  // ─── 2B. LINK EXISTING INSTALLATION (MANUAL / FALLBACK) ─────────────
  const linkExistingInstallation = useCallback(async (rawInput) => {
    if (!rawInput) return;
    const match = String(rawInput).match(/\d+/);
    if (!match) {
      setConnectError('Please enter a valid numeric GitHub installation ID or URL.');
      return;
    }
    const installId = match[0];
    setConnecting(true);
    setConnectError(null);

    try {
      let orgId = selectedOrgId;
      if (!orgId) {
        let orgList = await getOrganizations().catch(() => []);
        if (!orgList || orgList.length === 0) {
          const defaultName = (currentUser?.displayName || currentUser?.display_name || 'My Workspace').trim();
          const created = await createOrganization(defaultName).catch(() => null);
          if (created) orgList = [created.organization || created];
        }
        if (orgList && orgList.length > 0) {
          orgId = orgList[0].id;
          setSelectedOrgId(orgId);
          setOrganizations(orgList);
        }
      }
      if (!orgId) throw new Error('Workspace initialization in progress. Please try again.');

      // Check stored state token first, or get a fresh signed state token from backend
      let stateToken = '';
      try {
        const stored = JSON.parse(
          localStorage.getItem('kr0n_github_install') ||
          sessionStorage.getItem('kr0n_github_install') ||
          '{}'
        );
        if (stored?.state) stateToken = stored.state;
      } catch {
        // ignore JSON parse error
      }

      if (!stateToken) {
        const startData = await githubApi(`orgs/${orgId}/github/installations/start`);
        stateToken = startData?.state;
      }

      if (!stateToken) {
        throw new Error('Unable to generate verification handshake. Please retry.');
      }

      await githubApi(`orgs/${orgId}/github/installations`, {
        method: 'POST',
        body: JSON.stringify({
          installation_id: installId,
          state: stateToken,
        }),
      });

      sessionStorage.removeItem('kr0n_github_install');
      localStorage.removeItem('kr0n_github_install');

      await refreshGitHubState(orgId);
    } catch (err) {
      console.error('[kr0n] Failed to link installation:', err);
      setConnectError(err.message || 'Failed to link GitHub installation.');
    } finally {
      setConnecting(false);
    }
  }, [selectedOrgId, currentUser, refreshGitHubState]);

  // Disconnect GitHub installation from organization workspace
  const disconnectGitHubInstallation = useCallback(async () => {
    if (!selectedOrgId || !activeInstallation?.installation_id) return;
    try {
      setLoading(true);
      await githubApi(
        `orgs/${selectedOrgId}/github/installations/${activeInstallation.installation_id}`,
        { method: 'DELETE' }
      );
      await refreshGitHubState(selectedOrgId);
    } catch (err) {
      console.error('[kr0n] Failed to disconnect GitHub:', err);
      // Auto-recover local state
      setIsGitHubConnected(false);
      setActiveInstallation(null);
      setInstallations([]);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, activeInstallation, refreshGitHubState]);

  // Auto-link if installation_id is passed in query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = new URLSearchParams(window.location.search);
    const installParam = query.get('installation_id');
    if (installParam && selectedOrgId) {
      Promise.resolve().then(() => {
        linkExistingInstallation(installParam);
      });
    }
  }, [selectedOrgId, linkExistingInstallation]);

  // Close custom dropdown menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) {
        setShowPresetMenu(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (teamMenuRef.current && !teamMenuRef.current.contains(event.target)) {
        setShowTeamMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── 3. FETCH BRANCHES & DIRS ON REPO SELECTION ─────────────────────
  useEffect(() => {
    if (!selectedRepo || !selectedOrgId) return;
    let active = true;

    const instIdParam = activeInstallation?.installation_id ? `&installation_id=${activeInstallation.installation_id}` : '';
    const instIdQuery = activeInstallation?.installation_id ? `?installation_id=${activeInstallation.installation_id}` : '';

    githubApi(
      `orgs/${selectedOrgId}/github/repositories/${encodeURIComponent(selectedRepo.owner)}/${encodeURIComponent(selectedRepo.name)}/branches${instIdQuery}`
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
      `orgs/${selectedOrgId}/github/repositories/${encodeURIComponent(selectedRepo.owner)}/${encodeURIComponent(selectedRepo.name)}/directories?ref=${selectedBranch}${instIdParam}`
    )
      .then((data) => {
        if (!active) return;
        const dirs = data?.directories || [];
        if (dirs.length > 0) {
          setDirectories(dirs.map((d) => (d === '/' ? './' : d)));
          setDirEntries(data?.entries || []);
          setDirTreeRoot(data?.root || null);
          setSelectedDir('./');
        }
      })
      .catch(() => {
        if (active) {
          setDirectories(['./']);
          setDirEntries([]);
          setDirTreeRoot(null);
          setSelectedDir('./');
        }
      });

    return () => {
      active = false;
    };
  }, [selectedRepo, selectedOrgId, selectedBranch, activeInstallation?.installation_id]);

  // Handle clicking "Import" on a repository (Screen 1 -> Screen 2)
  function handleSelectRepo(r) {
    setSelectedRepo(r);
    const cleanName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setProjectName(cleanName);
    setSelectedBranch(r.default_branch || 'main');
    setSelectedDir('./');

    // Synchronously auto-select matching Railpack preset from repository metadata
    const detected = detectPresetSynchronously(r);
    setPresetId(detected);

    // Reset override toggles so pristine defaults of detected preset display cleanly
    setBuildOverride(false);
    setCustomBuildCommand('');
    setOutputOverride(false);
    setCustomOutputDir('');
    setInstallOverride(false);
    setCustomInstallCommand('');

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

  // Handle deploying the project (navigates to Deployment Details view)
  async function handleDeploy() {
    if (!projectName.trim()) return;
    setBusy(true);

    const activePreset =
      APPLICATION_PRESETS.find((p) => p.id === presetId) || APPLICATION_PRESETS[0];
    const buildCmd =
      buildOverride && customBuildCommand.trim()
        ? customBuildCommand.trim()
        : activePreset.buildCommand;
    const outDir =
      outputOverride && customOutputDir.trim()
        ? customOutputDir.trim()
        : activePreset.outputDir;
    const instCmd =
      installOverride && customInstallCommand.trim()
        ? customInstallCommand.trim()
        : activePreset.installCommand;

    try {
      const newProj = addProject({
        name: projectName.trim(),
        repository:
          selectedRepo?.full_name || `${accountLogin}/${selectedRepo?.name || projectName.trim()}`,
        branch: selectedBranch || 'main',
        rootDir: selectedDir || './',
        preset: activePreset.id,
        category: activePreset.category,
        runtime: activePreset.name,
        runtimeLabel: `${activePreset.name} Application`,
        buildCommand: buildCmd,
        outputDir: outDir,
        installCommand: instCmd,
        buildOverride,
        outputOverride,
        installOverride,
        envVars,
        environment: 'production',
      });

      router.push(`/projects/${newProj.id}`);
    } catch (err) {
      console.error('[kr0n] Deploy failed:', err);
      setBusy(false);
    }
  }

  const teamDisplayName =
    organizations.find((o) => o.id === selectedOrgId)?.name || `${accountLogin}'s Team`;

  const filteredRepos = repos
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const timeA = getRepoTimestamp(a);
      const timeB = getRepoTimestamp(b);
      if (timeB !== timeA) return timeB - timeA;
      return (a.name || '').localeCompare(b.name || '');
    });

  const totalPages = Math.max(1, Math.ceil(filteredRepos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRepos = filteredRepos.slice(startIndex, startIndex + PAGE_SIZE);

  const currentPreset =
    APPLICATION_PRESETS.find((p) => p.id === presetId) || APPLICATION_PRESETS[0];

  return (
    <main className="min-h-screen bg-[#000000] text-white flex flex-col justify-start items-center p-6 sm:p-12 font-sans selection:bg-white selection:text-black">
      {/* STATE 0: INITIAL LOADING SKELETON */}
      {loading && (
        <div className="w-full max-w-3xl space-y-5 animate-pulse">
          <div className="h-8 w-64 bg-neutral-900 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-48 bg-neutral-900 rounded" />
            <div className="h-10 flex-1 bg-neutral-900 rounded" />
          </div>
          <div className="h-48 border border-[#222222] bg-[#0c0c0c] rounded-lg flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-neutral-500" />
          </div>
        </div>
      )}

      {/* STATE 1: GITHUB NOT CONNECTED */}
      {!loading && !isGitHubConnected && step === 'select' && (
        <GitHubNotConnected
          accountEmail={accountEmail}
          connectError={connectError}
          connecting={connecting}
          connectGitHubApp={connectGitHubApp}
          manualInstallId={manualInstallId}
          setManualInstallId={setManualInstallId}
          linkExistingInstallation={linkExistingInstallation}
        />
      )}

      {/* STATE 2: GITHUB CONNECTED - IMPORT GIT REPOSITORY (SCREEN 1) */}
      {!loading && isGitHubConnected && step === 'select' && (
        <RepoListScreen
          activeInstallation={activeInstallation}
          currentUser={currentUser}
          accountLogin={accountLogin}
          showAccountMenu={showAccountMenu}
          setShowAccountMenu={setShowAccountMenu}
          accountMenuRef={accountMenuRef}
          connectGitHubApp={connectGitHubApp}
          search={search}
          setSearch={setSearch}
          setPage={setPage}
          fetchingRepos={fetchingRepos}
          repos={repos}
          filteredRepos={filteredRepos}
          paginatedRepos={paginatedRepos}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          PAGE_SIZE={PAGE_SIZE}
          handleSelectRepo={handleSelectRepo}
          disconnectGitHubInstallation={disconnectGitHubInstallation}
        />
      )}

      {/* SCREEN 2: CONFIGURE & DEPLOY NEW PROJECT */}
      {step === 'configure' && selectedRepo && (
        <ConfigureProjectScreen
          selectedRepo={selectedRepo}
          accountLogin={accountLogin}
          selectedBranch={selectedBranch}
          onBack={() => setStep('select')}
          teamDisplayName={teamDisplayName}
          showTeamMenu={showTeamMenu}
          setShowTeamMenu={setShowTeamMenu}
          teamMenuRef={teamMenuRef}
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          setSelectedOrgId={setSelectedOrgId}
          refreshGitHubState={refreshGitHubState}
          projectName={projectName}
          setProjectName={setProjectName}
          selectedDir={selectedDir}
          onOpenDirModal={() => setIsDirModalOpen(true)}
          presetId={presetId}
          setPresetId={setPresetId}
          currentPreset={currentPreset}
          showPresetMenu={showPresetMenu}
          setShowPresetMenu={setShowPresetMenu}
          presetMenuRef={presetMenuRef}
          expandBuildSettings={expandBuildSettings}
          setExpandBuildSettings={setExpandBuildSettings}
          buildOverride={buildOverride}
          setBuildOverride={setBuildOverride}
          customBuildCommand={customBuildCommand}
          setCustomBuildCommand={setCustomBuildCommand}
          outputOverride={outputOverride}
          setOutputOverride={setOutputOverride}
          customOutputDir={customOutputDir}
          setCustomOutputDir={setCustomOutputDir}
          installOverride={installOverride}
          setInstallOverride={setInstallOverride}
          customInstallCommand={customInstallCommand}
          setCustomInstallCommand={setCustomInstallCommand}
          expandEnvVars={expandEnvVars}
          setExpandEnvVars={setExpandEnvVars}
          envVars={envVars}
          setEnvVars={setEnvVars}
          envKey={envKey}
          setEnvKey={setEnvKey}
          envVal={envVal}
          setEnvVal={setEnvVal}
          handleAddEnvVar={handleAddEnvVar}
          busy={busy}
          handleDeploy={handleDeploy}
        />
      )}

      {/* Interactive Directory Map Modal */}
      {isDirModalOpen && (
        <DirectoryMapModal
          onClose={() => setIsDirModalOpen(false)}
          repoName={selectedRepo?.name || 'Repository'}
          branch={selectedBranch || 'main'}
          rootNode={dirTreeRoot}
          dirEntries={dirEntries}
          directories={directories}
          selectedDir={selectedDir}
          defaultPresetId={presetId}
          repoLanguage={selectedRepo?.language}
          onSelectDir={(dir, detectedPreset) => {
            setSelectedDir(dir);
            if (detectedPreset) {
              setPresetId(detectedPreset);
            }
          }}
        />
      )}
    </main>
  );
}
