'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowLeft,
  Lock,
  GitBranch,
  Folder,
  FolderOpen,
  FolderTree,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { githubApi } from '@/lib/github-api';
import {
  getOrganizations,
  createOrganization,
  getMe,
  useAuthUser,
} from '@/lib/auth';
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
  if (lower.includes('vite')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M12 2L2 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('next') || lower.includes('react')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 border border-white/30 text-white shrink-0">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M12 3L22 21H2L12 3z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('remix')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-500/40 text-blue-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-5h2zm0-7h-2V7.5h2z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('nuxt') || lower.includes('vue')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 3L1 21h22L12 3zm0 5l6.5 11h-13L12 8z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('node')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500/20 border border-green-500/40 text-green-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8-3.3 1.9-6.8-3.8 3.3-1.9z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('python')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M11.9 2C8.6 2 6.7 3.5 6.7 5.8v2.4h5.2v.7H4.3c-2.3 0-4.3 1.9-4.3 5.2 0 3.3 1.8 5.1 5.1 5.1h2.2v-2.5c0-2.3 1.9-4.3 4.3-4.3h5.2v-.7h-5.2c-2.3 0-4.3-1.9-4.3-4.3V5.8c0-2.3 2.3-3.8 4.6-3.8z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-700 text-neutral-300 shrink-0">
      <GitBranch size={11} />
    </div>
  );
}

function getRepoTimestamp(r) {
  if (!r) return 0;
  const candidates = [r.pushed_at, r.updated_at, r.created_at];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      const ms = new Date(c).getTime();
      if (!isNaN(ms) && ms > 0) return ms;
    } else if (typeof c === 'number') {
      return c > 1e11 ? c : c * 1000;
    } else if (typeof c === 'object' && c.seconds) {
      return Number(c.seconds) * 1000;
    }
  }
  return 0;
}

function formatLastModified(r) {
  const ms = getRepoTimestamp(r);
  if (!ms) return 'Recently';
  try {
    const diffMs = Date.now() - ms;
    if (isNaN(diffMs)) return 'Recently';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function DirectoryMapModal({
  onClose,
  repoName,
  branch,
  rootNode,
  directories = [],
  selectedDir,
  onSelectDir,
}) {
  const [tempSelected, setTempSelected] = useState(selectedDir || './');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState(new Set(['/']));

  function toggleExpand(path, e) {
    e.stopPropagation();
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function handleConfirm() {
    onSelectDir(tempSelected);
    onClose();
  }

  const filteredDirs = searchQuery.trim()
    ? directories.filter((d) =>
        d.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  function renderNode(node, depth = 0) {
    if (!node) return null;
    const pathFormatted = node.path === '/' ? './' : node.path.replace(/^\//, '');
    const isSelected = tempSelected === pathFormatted || tempSelected === node.path;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path);

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => setTempSelected(pathFormatted)}
          style={{ paddingLeft: `${depth * 18 + 12}px` }}
          className={`flex items-center justify-between py-1.5 pr-3 rounded-md cursor-pointer text-xs font-mono transition-colors group ${
            isSelected
              ? 'bg-white/10 text-white font-medium border border-white/20'
              : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.path, e)}
                className="w-4 h-4 flex items-center justify-center text-neutral-500 hover:text-white shrink-0"
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {isExpanded ? (
              <FolderOpen size={14} className="text-amber-400 shrink-0" />
            ) : (
              <Folder size={14} className="text-neutral-400 shrink-0" />
            )}

            <span className="truncate">
              {node.path === '/' ? './ (repository root)' : node.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {node.path !== '/' && (
              <span className="text-[10px] text-neutral-500 font-sans group-hover:text-neutral-400">
                {pathFormatted}
              </span>
            )}
            {isSelected && <Check size={13} className="text-white" />}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0c0c] border border-[#222222] rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1c1c1c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <FolderTree size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Select Root Directory</h2>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-mono">
                <span>{repoName}</span>
                <span>•</span>
                <GitBranch size={10} className="inline text-neutral-500" />
                <span>{branch}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#1c1c1c] bg-[#0f0f0f]">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search directories in repository..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#222222] focus:border-[#444444] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
            />
          </div>
        </div>

        {/* Tree content */}
        <div className="p-3 overflow-y-auto max-h-[380px] space-y-1">
          {searchQuery.trim() ? (
            filteredDirs.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500 font-sans">
                No directories matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredDirs.map((dir) => {
                const isSelected = tempSelected === dir;
                return (
                  <div
                    key={dir}
                    onClick={() => setTempSelected(dir)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-white/10 text-white font-medium border border-white/20'
                        : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder size={14} className="text-neutral-400 shrink-0" />
                      <span className="truncate">{dir}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-white shrink-0" />}
                  </div>
                );
              })
            )
          ) : rootNode ? (
            renderNode(rootNode)
          ) : (
            directories.map((dir) => {
              const isSelected = tempSelected === dir;
              return (
                <div
                  key={dir}
                  onClick={() => setTempSelected(dir)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs font-mono transition-colors ${
                    isSelected
                      ? 'bg-white/10 text-white font-medium border border-white/20'
                      : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder size={14} className="text-neutral-400 shrink-0" />
                    <span className="truncate">{dir}</span>
                  </div>
                  {isSelected && <Check size={13} className="text-white shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#1c1c1c] bg-[#0f0f0f] flex items-center justify-between gap-3">
          <div className="text-xs truncate">
            <span className="text-neutral-500 font-sans">Selected: </span>
            <code className="text-white font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
              {tempSelected}
            </code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-white text-black font-semibold text-xs px-4 py-1.5 rounded-md hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          ).catch((err) => {
            console.warn('[kr0n] Failed to fetch repositories:', err?.message);
            return { repositories: [] };
          });

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

    const lowerName = r.name.toLowerCase();
    if (lowerName.includes('next')) {
      setPresetId('nextjs');
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
        runtime: activePreset.name,
        runtimeLabel: `${activePreset.name} Application`,
        buildCommand: buildCmd,
        outputDir: outDir,
        installCommand: instCmd,
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
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATE 0: INITIAL LOADING SKELETON                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATE 1: GITHUB NOT CONNECTED (E.G. LOGGED IN VIA GOOGLE)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!loading && !isGitHubConnected && step === 'select' && (
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Import Git Repository</h1>

          <div className="border border-[#222222] bg-[#0c0c0c] rounded-xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
            {/* GitHub Octocat Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white mx-auto flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Connect your GitHub account
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {accountEmail ? (
                  <>
                    You are signed in with <span className="text-white font-medium">{accountEmail}</span>.
                    To view and import your repositories, connect your GitHub account.
                  </>
                ) : (
                  'Connect your GitHub account or organization to import repositories and trigger deployments.'
                )}
              </p>
            </div>

            {connectError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center justify-center gap-2 max-w-md mx-auto">
                <AlertCircle size={14} className="shrink-0" />
                <span>{connectError}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={connecting}
                onClick={connectGitHubApp}
                className="bg-white text-black font-semibold text-sm px-6 py-2.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Connecting to GitHub…</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>Connect GitHub</span>
                  </>
                )}
              </button>
            </div>

            {/* Manual Completion Box (if GitHub didn't auto-redirect after installation) */}
            <div className="pt-4 border-t border-[#1c1c1c] max-w-md mx-auto space-y-2 text-left">
              <span className="block text-xs text-neutral-400 font-medium">
                Already installed the app on GitHub? Complete setup below:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Installation ID or URL (e.g. 184229460)"
                  value={manualInstallId}
                  onChange={(e) => setManualInstallId(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#222222] focus:border-[#444444] rounded px-3 py-2 text-xs text-white outline-none font-mono"
                />
                <button
                  type="button"
                  disabled={connecting || !manualInstallId.trim()}
                  onClick={() => linkExistingInstallation(manualInstallId)}
                  className="bg-white text-black font-semibold text-xs px-4 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                >
                  {connecting ? 'Linking…' : 'Link App'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-mono">
              Only repositories you grant access to will be synchronized.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATE 2: GITHUB CONNECTED - IMPORT GIT REPOSITORY (IMAGE 1)         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!loading && isGitHubConnected && step === 'select' && (
        <div className="w-full max-w-3xl space-y-5">
          {/* Header Title */}
          <h1 className="text-2xl font-bold tracking-tight text-white">Import Git Repository</h1>

          {/* Account Selector & Search Bar Row */}
          <div className="flex items-center gap-3">
            {/* Account Selector Pill */}
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 bg-[#0c0c0c] border border-[#222222] hover:border-[#333333] rounded-md px-3 py-2 text-sm text-neutral-200 shrink-0 cursor-pointer transition-colors"
              >
                {activeInstallation?.avatar_url || currentUser?.avatarUrl || currentUser?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      activeInstallation?.avatar_url ||
                      currentUser?.avatarUrl ||
                      currentUser?.avatar_url
                    }
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
                <div className="absolute left-0 mt-1.5 w-64 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 text-xs">
                  <div className="px-3 py-1.5 text-neutral-400 font-mono text-[10px] uppercase">
                    Connected Account
                  </div>
                  <div className="px-3 py-1.5 flex items-center justify-between text-white font-medium">
                    <span className="truncate">{accountLogin}</span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check size={11} /> Connected
                    </span>
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
                    <GitBranch size={13} /> Manage Repository Permissions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      connectGitHubApp();
                    }}
                    className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={13} /> Add Another GitHub Account
                  </button>
                </div>
              )}
            </div>

            {/* Search Input Box */}
            <div className="flex-1 flex items-center gap-2.5 bg-[#0c0c0c] border border-[#222222] focus-within:border-[#444444] rounded-md px-3.5 py-2 text-sm text-white transition-colors">
              {fetchingRepos ? (
                <Loader2 size={15} className="text-neutral-400 animate-spin shrink-0" />
              ) : (
                <Search size={15} className="text-neutral-500 shrink-0" />
              )}
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Repository List Box */}
          <div className="border border-[#222222] bg-[#0c0c0c] rounded-lg divide-y divide-[#1c1c1c] overflow-hidden">
            {fetchingRepos ? (
              <div className="divide-y divide-[#181818]">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="px-4 py-3.5 flex items-center justify-between animate-pulse"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-800" />
                      <div className="h-4 w-36 sm:w-48 bg-neutral-800 rounded" />
                      <div className="h-3 w-16 bg-neutral-900 rounded hidden sm:block" />
                    </div>
                    <div className="h-7 w-16 bg-neutral-800/80 rounded-md" />
                  </div>
                ))}
              </div>
            ) : repos.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-neutral-400">
                  No repositories found for this account.
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Ensure you authorized KR0N to access your repositories on GitHub.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={connectGitHubApp}
                    className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Configure Repository Permissions
                  </button>
                </div>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No repositories found matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              <>
                {paginatedRepos.map((r) => (
                  <div
                    key={r.id || r.name}
                    className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left: Icon + Name + Lock + Date */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RepoIcon type={r.type} name={r.name} />
                      <span className="font-medium text-sm text-white truncate">{r.name}</span>
                      {r.private && <Lock size={12} className="text-neutral-400 shrink-0 ml-0.5" />}
                      <span className="text-neutral-400 text-sm shrink-0">
                        · {r.updatedDate || 'Recently'}
                      </span>
                    </div>

                    {/* Right: White Import Button */}
                    <button
                      onClick={() => handleSelectRepo(r)}
                      className="bg-white text-black font-semibold text-sm px-5 py-1.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
                    >
                      Import
                    </button>
                  </div>
                ))}

                {/* Pagination Footer */}
                {filteredRepos.length > PAGE_SIZE && (
                  <div className="px-4 py-3 bg-[#0c0c0c] flex items-center justify-between border-t border-[#1c1c1c] text-xs">
                    <span className="text-neutral-400 font-mono text-[11px]">
                      Showing <span className="text-white font-medium">{startIndex + 1}</span>–
                      <span className="text-white font-medium">
                        {Math.min(startIndex + PAGE_SIZE, filteredRepos.length)}
                      </span>{' '}
                      of <span className="text-white font-medium">{filteredRepos.length}</span> repositories
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded border border-[#222222] bg-[#121212] text-neutral-300 hover:text-white hover:border-[#333333] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <ChevronLeft size={13} />
                        <span>Prev</span>
                      </button>

                      {/* Page number indicators */}
                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                          .reduce((acc, p, idx, arr) => {
                            if (idx > 0 && p - arr[idx - 1] > 1) {
                              acc.push('ellipsis-' + p);
                            }
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((item) => {
                            if (typeof item === 'string') {
                              return (
                                <span key={item} className="px-1 text-neutral-600 font-mono">
                                  …
                                </span>
                              );
                            }
                            const isCurrent = item === currentPage;
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                className={`w-7 h-7 rounded text-xs font-mono transition-colors cursor-pointer flex items-center justify-center ${
                                  isCurrent
                                    ? 'bg-white text-black font-semibold'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#222222]'
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}
                      </div>

                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded border border-[#222222] bg-[#121212] text-neutral-300 hover:text-white hover:border-[#333333] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>Next</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                Vercel Team
              </label>
              <button
                type="button"
                onClick={() => setShowTeamMenu((prev) => !prev)}
                className="w-full border border-[#222222] bg-[#121212] hover:border-[#333333] rounded-md px-3 py-2 flex items-center justify-between text-sm text-white transition-colors cursor-pointer text-left focus:outline-none focus:border-neutral-500"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate text-xs font-medium">{teamDisplayName}</span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                    Hobby
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-neutral-400 shrink-0 ml-1 transition-transform duration-150 ${
                    showTeamMenu ? 'rotate-180' : ''
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
                        className={`w-full px-3 py-2 flex items-center justify-between transition-colors text-left cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.08] text-white font-medium'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-emerald-400' : 'bg-neutral-600'
                            }`}
                          />
                          <span className="text-xs truncate">{org.name}</span>
                          <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1 rounded font-mono">
                            Hobby
                          </span>
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
                  onClick={() => setIsDirModalOpen(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors"
                >
                  Edit / Browse Map
                </button>
              </div>
              <div
                onClick={() => setIsDirModalOpen(true)}
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
                  className={`text-neutral-400 transition-transform duration-150 shrink-0 ${
                    showPresetMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showPresetMenu && (
                <div className="absolute left-0 right-0 mt-1.5 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 max-h-64 overflow-y-auto divide-y divide-[#181818]">
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
                        {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
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
                  className={`text-neutral-400 transition-transform ${
                    expandBuildSettings ? 'rotate-90' : ''
                  }`}
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
                  className={`text-neutral-400 transition-transform ${
                    expandEnvVars ? 'rotate-90' : ''
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

      {/* Interactive Directory Map Modal */}
      {isDirModalOpen && (
        <DirectoryMapModal
          onClose={() => setIsDirModalOpen(false)}
          repoName={selectedRepo?.name || 'Repository'}
          branch={selectedBranch || 'main'}
          rootNode={dirTreeRoot}
          directories={directories}
          selectedDir={selectedDir}
          onSelectDir={(dir) => setSelectedDir(dir)}
        />
      )}
    </main>
  );
}
