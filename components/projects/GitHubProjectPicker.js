'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { githubApi } from '@/lib/github-api';
import { getMe, useAuthUser } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace-context';
import { buildBuildSettingsPayload } from '@/lib/projects-api';

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

function getRepoOwner(repo, fallbackLogin) {
  if (!repo) return fallbackLogin;
  return repo.owner || (repo.full_name ? repo.full_name.split('/')[0] : fallbackLogin);
}

export default function GitHubProjectPicker() {
  const router = useRouter();
  const {
    organizations,
    activeOrgId,
    setActiveOrgId,
    presets,
    hasLoaded,
    createOrganization,
    createProject,
  } = useWorkspace();

  const [step, setStep] = useState('select');

  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;

  const [loading, setLoading] = useState(true);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [activeInstallation, setActiveInstallation] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

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

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
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

  const [busy, setBusy] = useState(false);
  const [deployError, setDeployError] = useState('');

  const availablePresets =
    Array.isArray(presets) && presets.length > 0 ? presets : APPLICATION_PRESETS;

  const accountLogin =
    activeInstallation?.account_login ||
    currentUser?.displayName ||
    currentUser?.display_name ||
    currentUser?.email?.split('@')[0] ||
    'Developer';

  const accountEmail = currentUser?.email || '';

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

      if (instList.length > 0) {
        setIsGitHubConnected(true);
        const inst = instList[0];
        setActiveInstallation(inst);
        setFetchingRepos(true);

        try {
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
        } catch {
          setIsGitHubConnected(false);
          setActiveInstallation(null);
          setRepos([]);
        } finally {
          setFetchingRepos(false);
        }
      } else {
        setIsGitHubConnected(false);
        setActiveInstallation(null);
        setRepos([]);
      }
    } catch {
      setIsGitHubConnected(false);
      setActiveInstallation(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        if (active && me) setLiveUser(me);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeOrgId) {
      if (hasLoaded) {
        Promise.resolve().then(() => setLoading(false));
      }
      return;
    }
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        refreshGitHubState(activeOrgId);
      }
    });
    return () => {
      active = false;
    };
  }, [activeOrgId, hasLoaded, refreshGitHubState]);

  async function connectGitHubApp() {
    setConnecting(true);
    setConnectError(null);

    try {
      let orgId = activeOrgId;
      if (!orgId) {
        const defaultName = (
          currentUser?.displayName ||
          currentUser?.display_name ||
          'My Workspace'
        ).trim();
        const created = await createOrganization(defaultName).catch(() => null);
        if (created?.id) {
          orgId = created.id;
        }
      }

      if (!orgId) {
        throw new Error(
          'Workspace initialization is taking longer than expected. Please try again.'
        );
      }

      const data = await githubApi(`orgs/${orgId}/github/installations/start`);
      if (data?.install_url && data?.state) {
        const installMeta = JSON.stringify({ org: orgId, state: data.state });
        sessionStorage.setItem('kr0n_github_install', installMeta);
        localStorage.setItem('kr0n_github_install', installMeta);
        window.location.assign(data.install_url);
        return;
      }

      throw new Error(data?.error || 'No installation URL returned by GitHub gateway.');
    } catch (err) {
      setConnectError(err.message || 'Unable to start GitHub connection.');
      setConnecting(false);
    }
  }

  const disconnectGitHubInstallation = useCallback(async () => {
    if (!activeOrgId || !activeInstallation?.installation_id) return;
    try {
      setLoading(true);
      await githubApi(
        `orgs/${activeOrgId}/github/installations/${activeInstallation.installation_id}`,
        { method: 'DELETE' }
      );
      await refreshGitHubState(activeOrgId);
    } catch {
      setIsGitHubConnected(false);
      setActiveInstallation(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, activeInstallation, refreshGitHubState]);

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

  // Fetch branches when a repository is selected
  useEffect(() => {
    if (!selectedRepo || !activeOrgId) return;
    let active = true;

    const repoOwner = getRepoOwner(selectedRepo, accountLogin);
    const instIdQuery = activeInstallation?.installation_id
      ? `?installation_id=${activeInstallation.installation_id}`
      : '';

    githubApi(
      `orgs/${activeOrgId}/github/repositories/${encodeURIComponent(repoOwner)}/${encodeURIComponent(selectedRepo.name)}/branches${instIdQuery}`
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

    return () => {
      active = false;
    };
  }, [selectedRepo, activeOrgId, activeInstallation?.installation_id, accountLogin]);

  // Fetch directories when repository or branch changes
  useEffect(() => {
    if (!selectedRepo || !activeOrgId || !selectedBranch) return;
    let active = true;

    const repoOwner = getRepoOwner(selectedRepo, accountLogin);
    const instIdParam = activeInstallation?.installation_id
      ? `&installation_id=${activeInstallation.installation_id}`
      : '';

    githubApi(
      `orgs/${activeOrgId}/github/repositories/${encodeURIComponent(repoOwner)}/${encodeURIComponent(selectedRepo.name)}/directories?ref=${encodeURIComponent(selectedBranch)}${instIdParam}`
    )
      .then((data) => {
        if (!active) return;
        const dirs = data?.directories || [];
        if (dirs.length > 0) {
          setDirectories(dirs.map((d) => (d === '/' ? './' : d)));
          setDirEntries(data?.entries || []);
          setDirTreeRoot(data?.root || null);
          if (data?.root?.detected_preset) {
            setPresetId(data.root.detected_preset);
          }
        }
      })
      .catch(() => {
        if (active) {
          setDirectories(['./']);
          setDirEntries([]);
          setDirTreeRoot(null);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedRepo, activeOrgId, selectedBranch, activeInstallation?.installation_id, accountLogin]);

  function handleSelectRepo(r) {
    setSelectedRepo(r);
    const cleanName = r.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    setProjectName(cleanName || r.name);
    setProjectDescription(r.description || '');
    setSelectedBranch(r.default_branch || 'main');
    setSelectedDir('./');
    setDeployError('');

    const detected = detectPresetSynchronously(r);
    setPresetId(detected);

    setBuildOverride(false);
    setCustomBuildCommand('');
    setOutputOverride(false);
    setCustomOutputDir('');
    setInstallOverride(false);
    setCustomInstallCommand('');

    setStep('configure');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeploy() {
    if (!projectName.trim() || !activeOrgId || !selectedRepo) return;
    setBusy(true);
    setDeployError('');

    const activePreset =
      availablePresets.find((p) => p.id === presetId) || availablePresets[0];

    const repoOwner = getRepoOwner(selectedRepo, accountLogin);

    const buildSettings = buildBuildSettingsPayload({
      installOverride,
      customInstallCommand,
      buildOverride,
      customBuildCommand,
      outputOverride,
      customOutputDir,
    });

    try {
      const created = await createProject({
        orgId: activeOrgId,
        name: projectName.trim(),
        description: projectDescription.trim(),
        github_installation_id: Number(activeInstallation?.installation_id || 0),
        repo_id: Number(selectedRepo.id || 0),
        repo_owner: repoOwner,
        repo_name: selectedRepo.name,
        production_branch: selectedBranch || 'main',
        root_directory: selectedDir || './',
        application_preset: activePreset.id,
        build_settings: buildSettings,
      });

      router.push(`/projects/${created.id}`);
    } catch (err) {
      setDeployError(err.message || 'Failed to create project in control plane.');
      setBusy(false);
    }
  }

  const teamDisplayName =
    organizations.find((o) => o.id === activeOrgId)?.name || `${accountLogin}'s Workspace`;

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
    availablePresets.find((p) => p.id === presetId) || availablePresets[0];

  const activeStepIndex = !isGitHubConnected ? 0 : step === 'configure' ? 2 : 1;
  const importerSteps = ['Connect GitHub', 'Choose repository', 'Configure project'];

  return (
    <main className='min-h-screen bg-kr0n-canvas text-kr0n-text flex flex-col justify-start items-center px-6 py-8 sm:p-10 font-sans'>
      {/* 3-step horizontal progress rail */}
      <div className='w-full max-w-5xl mb-8 border-b border-kr0n-line pb-0'>
        <div className='flex items-center gap-6 overflow-x-auto no-scrollbar text-[13px]'>
          {importerSteps.map((label, idx) => {
            const isCurrent = idx === activeStepIndex;
            const isDone = idx < activeStepIndex;
            return (
              <div
                key={label}
                className={`pb-3 border-b shrink-0 transition-colors duration-150 ${
                  isCurrent
                    ? 'border-kr0n-accent text-white font-medium'
                    : isDone
                    ? 'border-transparent text-kr0n-text-secondary'
                    : 'border-transparent text-kr0n-faint'
                }`}
              >
                <span className='font-mono text-xs mr-2 text-kr0n-muted'>{idx + 1}.</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className='w-full max-w-3xl space-y-5'>
          <div className='h-7 w-56 bg-kr0n-black rounded-[6px]' />
          <div className='flex gap-3'>
            <div className='h-10 w-44 bg-kr0n-black rounded-[6px]' />
            <div className='h-10 flex-1 bg-kr0n-black rounded-[6px]' />
          </div>
          <div className='h-48 border border-kr0n-line bg-kr0n-black rounded-[6px] flex items-center justify-center'>
            <Loader2 size={20} className='animate-spin text-kr0n-muted' />
          </div>
        </div>
      )}

      {!loading && !isGitHubConnected && step === 'select' && (
        <GitHubNotConnected
          accountEmail={accountEmail}
          connectError={connectError}
          connecting={connecting}
          connectGitHubApp={connectGitHubApp}
        />
      )}

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

      {step === 'configure' && selectedRepo && (
        <ConfigureProjectScreen
          selectedRepo={selectedRepo}
          accountLogin={accountLogin}
          branches={branches}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          onBack={() => setStep('select')}
          teamDisplayName={teamDisplayName}
          showTeamMenu={showTeamMenu}
          setShowTeamMenu={setShowTeamMenu}
          teamMenuRef={teamMenuRef}
          organizations={organizations}
          selectedOrgId={activeOrgId}
          setSelectedOrgId={setActiveOrgId}
          refreshGitHubState={refreshGitHubState}
          projectName={projectName}
          setProjectName={setProjectName}
          projectDescription={projectDescription}
          setProjectDescription={setProjectDescription}
          selectedDir={selectedDir}
          onOpenDirModal={() => setIsDirModalOpen(true)}
          availablePresets={availablePresets}
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
          deployError={deployError}
          busy={busy}
          handleDeploy={handleDeploy}
        />
      )}

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
          availablePresets={availablePresets}
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
