'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Terminal,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Globe,
  GitBranch,
  GitCommit,
  Clock,
  ArrowUpCircle,
  Check,
  X,
  Sliders,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import { getMe, useAuthUser } from '@/lib/auth';

export default function ProjectDeploymentDetailPage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const router = useRouter();

  const { projects, deleteProject } = useKr0nStore();
  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;

  // UI state
  const [showLogs, setShowLogs] = useState(false);
  const [expandSettings, setExpandSettings] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVisitDropdown, setShowVisitDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');

  // Sync current user profile
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await getMe();
        if (active && me) setLiveUser(me);
      } catch {
        // Safe ignore
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Find project in store or synthesize safe fallback
  const foundProject = projects.find((p) => p.id === projectId);
  const project = foundProject || {
    id: projectId,
    name: projectId.replace(/^proj_/, '').replace(/_[a-z0-9]+$/, '') || 'my-project',
    url: `${projectId.replace(/^proj_/, '').replace(/_[a-z0-9]+$/, '') || 'my-project'}.vercel.app`,
    repository: '',
    environment: 'production',
    currentDeployment: {
      version: 'v1.0.0',
      branch: 'main',
      commit: 'initial',
      commitMessage: 'initial setup',
      duration: '6s',
      timestamp: 'Just now',
      status: 'ready',
    },
    services: [
      {
        id: 'svc_web',
        name: 'web',
        runtime: 'Node.js',
        buildCommand: 'npm run build',
        outputDir: 'dist',
      },
    ],
  };

  const accountLogin =
    currentUser?.displayName || currentUser?.display_name || currentUser?.name || 'kr0n-user';
  const cleanName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const primaryDomain = project.url || `${cleanName}.vercel.app`;
  const branchDomain = `${cleanName}-git-main-${accountLogin}-4325s-projects.vercel.app`;
  const commitDomain = `${cleanName}-7t7jl8gy2-${accountLogin}-4325s-projects.vercel.app`;
  const deployment = project.currentDeployment || {
    branch: 'main',
    commit: 'add0788',
    commitMessage: 'made better',
    duration: '6s',
    timestamp: 'Oct 6',
    status: 'ready',
  };

  function handleCopyShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`https://${primaryDomain}`);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  }

  function handleDeleteProject() {
    deleteProject(project.id);
    setShowDeleteModal(false);
    router.push('/projects');
  }

  return (
    <main className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* ─── TOP HEADER BAR ─── */}
      <header className="border-b border-[#1c1c1c] bg-[#000000] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="text-neutral-400 hover:text-white transition-colors p-1 -ml-1 rounded"
            title="Back to Projects"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">
            Deployment Details
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleCopyShare}
            className="bg-[#0c0c0c] border border-[#222222] hover:border-[#333333] px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 size={13} className="text-neutral-400" />
            <span className="hidden sm:inline font-medium">Share</span>
          </button>

          {/* Logs Button */}
          <button
            type="button"
            onClick={() => setShowLogs(true)}
            className="bg-[#0c0c0c] border border-[#222222] hover:border-[#333333] px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Terminal size={13} className="text-neutral-400" />
            <span className="font-medium">Logs</span>
          </button>

          {/* Visit Split Button */}
          <div className="relative inline-flex items-center rounded-md">
            <a
              href={`https://${primaryDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black font-semibold px-3 py-1.5 text-xs rounded-l-md hover:bg-neutral-200 transition-colors flex items-center gap-1"
            >
              <span>Visit</span>
            </a>
            <button
              type="button"
              onClick={() => setShowVisitDropdown(!showVisitDropdown)}
              className="bg-white text-black px-1.5 py-1.5 text-xs rounded-r-md border-l border-neutral-300 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <ChevronDown size={13} />
            </button>

            {/* Visit Dropdown */}
            {showVisitDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-64 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 text-xs">
                <a
                  href={`https://${primaryDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 flex items-center justify-between text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="truncate">{primaryDomain}</span>
                  <ExternalLink size={12} className="shrink-0 text-neutral-500" />
                </a>
                <a
                  href={`https://${branchDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 flex items-center justify-between text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="truncate">{branchDomain}</span>
                  <ExternalLink size={12} className="shrink-0 text-neutral-500" />
                </a>
              </div>
            )}
          </div>

          {/* More Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="bg-[#0c0c0c] border border-[#222222] hover:border-[#333333] p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1.5 w-48 border border-[#222222] bg-[#0c0c0c] rounded-md shadow-2xl py-1 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowLogs(true);
                  }}
                  className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  View Build Output
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleCopyShare();
                  }}
                  className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Copy Deployment URL
                </button>
                <div className="border-t border-[#1c1c1c] my-1" />
                <Link
                  href={`/projects/${project.id}/settings`}
                  className="block px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Project Settings
                </Link>
                <div className="border-t border-[#1c1c1c] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={12} className="shrink-0" />
                  <span>Delete Project</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Copy notification toast */}
      {showShareToast && (
        <div className="fixed top-16 right-6 z-50 bg-[#121212] border border-[#27272a] text-white px-3.5 py-2 rounded-md shadow-2xl text-xs flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span>Deployment URL copied to clipboard</span>
        </div>
      )}

      {/* ─── MAIN DEPLOYMENT DETAILS BODY (MATCHING USER SCREENSHOT) ─── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-8 items-start">
          {/* ── LEFT: APPLICATION PREVIEW FRAME ── */}
          <div className="border border-[#222222] bg-[#0c0c0c] rounded-lg overflow-hidden group relative shadow-2xl">
            <a
              href={`https://${primaryDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer"
            >
              {/* Paper Model / Application Preview Visual */}
              <div className="bg-[#FAF7F2] text-[#1E1E1E] p-5 sm:p-6 aspect-[16/11] flex flex-col justify-between relative overflow-hidden select-none">
                {/* Site Header Nav */}
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs tracking-wider uppercase font-mono">
                      {project.name.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[9px] font-medium text-neutral-600">
                    <span>Models</span>
                    <span>Print & Media</span>
                    <span>Community</span>
                    <span>About</span>
                  </div>
                  <span className="bg-[#EA580C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Explore
                  </span>
                </div>

                {/* Hero Body */}
                <div className="grid grid-cols-2 gap-3 items-center my-auto py-2">
                  <div className="space-y-2">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-[#EA580C] font-bold">
                      Flat Sheet Precision
                    </p>
                    <h2 className="text-sm sm:text-base font-black leading-tight tracking-tight uppercase">
                      From Flat Paper to <span className="text-[#EA580C]">Extraordinary.</span>
                    </h2>
                    <p className="text-[9px] text-neutral-600 leading-snug line-clamp-3">
                      Detailed paper models designed to be folded, built, and proudly displayed.
                    </p>
                    <div className="pt-1">
                      <span className="inline-block bg-[#EA580C] text-white text-[9px] font-bold px-3 py-1 rounded">
                        Explore Collection
                      </span>
                    </div>
                  </div>

                  {/* Right Model Mockup Box */}
                  <div className="bg-white/80 border border-black/10 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-12 bg-gradient-to-tr from-[#EA580C] to-amber-400 rounded flex items-center justify-center text-white shadow-inner">
                      <Sliders size={20} className="opacity-90" />
                    </div>
                    <span className="text-[9px] font-bold mt-2 uppercase">{project.name}</span>
                    <span className="text-[8px] text-neutral-500 font-mono">Scale Edition</span>
                  </div>
                </div>

                {/* Bottom Stats Footer */}
                <div className="grid grid-cols-3 gap-2 border-t border-black/5 pt-2 text-[8px] font-mono text-neutral-600">
                  <div>
                    <span className="block font-bold text-black">100% Edge</span>
                    <span>Distributed</span>
                  </div>
                  <div>
                    <span className="block font-bold text-black">Global CDN</span>
                    <span>Sub-20ms</span>
                  </div>
                  <div>
                    <span className="block font-bold text-black">SSL Active</span>
                    <span>Automated</span>
                  </div>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1.5 backdrop-blur-[1px]">
                  <span>Visit Application</span>
                  <ExternalLink size={13} />
                </div>
              </div>
            </a>
          </div>

          {/* ── RIGHT: METADATA & DOMAIN SPECIFICATIONS ── */}
          <div className="space-y-6">
            {/* Top 4 Columns (Created, Status, Duration, Environment) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#1c1c1c]">
              {/* Created */}
              <div className="space-y-1">
                <span className="block text-xs text-neutral-400 font-medium">Created</span>
                <div className="flex items-center gap-1.5 text-sm text-white">
                  {currentUser?.avatarUrl || currentUser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatarUrl || currentUser.avatar_url}
                      alt={accountLogin}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {accountLogin[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <span className="truncate">{accountLogin}</span>
                  <span className="text-neutral-400 text-xs shrink-0">{deployment.timestamp || 'Oct 6'}</span>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <span className="block text-xs text-neutral-400 font-medium">Status</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-semibold text-white">Ready</span>
                  <span className="text-[10px] font-mono bg-[#1c1c1c] text-neutral-300 px-1.5 py-0.5 rounded">
                    Latest
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <span className="block text-xs text-neutral-400 font-medium">Duration</span>
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <Clock size={13} className="text-neutral-400 shrink-0" />
                  <span>{deployment.duration || '6s'}</span>
                  <span className="text-neutral-500 text-xs">46d ago</span>
                </div>
              </div>

              {/* Environment */}
              <div className="space-y-1">
                <span className="block text-xs text-neutral-400 font-medium">Environment</span>
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <ArrowUpCircle size={14} className="text-neutral-300 shrink-0" />
                  <span>Production</span>
                  <span className="text-[10px] font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                </div>
              </div>
            </div>

            {/* Domains Section */}
            <div className="space-y-2">
              <span className="block text-xs text-neutral-400 font-medium">Domains</span>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-neutral-400 shrink-0" />
                  <a
                    href={`https://${primaryDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline truncate"
                  >
                    {primaryDomain}
                  </a>
                  <span className="text-[10px] font-mono bg-[#1c1c1c] text-neutral-400 px-1.5 py-0.5 rounded">
                    +1
                  </span>
                </div>

                <div className="flex items-center gap-2 text-neutral-300">
                  <GitBranch size={14} className="text-neutral-400 shrink-0" />
                  <a
                    href={`https://${branchDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate text-neutral-300 hover:text-white"
                  >
                    {branchDomain}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-neutral-300">
                  <GitCommit size={14} className="text-neutral-400 shrink-0" />
                  <a
                    href={`https://${commitDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate text-neutral-300 hover:text-white"
                  >
                    {commitDomain}
                  </a>
                </div>
              </div>
            </div>

            {/* Source Section */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs text-neutral-400 font-medium">Source</span>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-white font-mono">
                  <GitBranch size={14} className="text-neutral-400 shrink-0" />
                  <span>{deployment.branch || 'main'}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-300">
                  <GitCommit size={14} className="text-neutral-400 shrink-0" />
                  <span className="font-mono text-neutral-400">{deployment.commit || 'add0788'}</span>
                  <span>{deployment.commitMessage || 'made better'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM ACCORDION: DEPLOYMENT SETTINGS ─── */}
        <div className="border border-[#1c1c1c] bg-[#0c0c0c] rounded-lg overflow-hidden mt-8">
          <button
            type="button"
            onClick={() => setExpandSettings(!expandSettings)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ChevronRight
                size={15}
                className={`text-neutral-400 transition-transform ${expandSettings ? 'rotate-90' : ''}`}
              />
              <span className="text-sm font-semibold text-white">Deployment Settings</span>
            </div>
            <span className="text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              2 Recommendations
            </span>
          </button>

          {expandSettings && (
            <div className="p-5 border-t border-[#1c1c1c] bg-black/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-400 font-mono">Framework Preset</span>
                <p className="text-white font-medium text-sm">Vite</p>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400 font-mono">Build Command</span>
                <p className="text-white font-mono text-xs">npm run build</p>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400 font-mono">Output Directory</span>
                <p className="text-white font-mono text-xs">dist</p>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400 font-mono">Node.js Version</span>
                <p className="text-white font-mono text-xs">20.x</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SLIDE-OVER LOGS DRAWER ─── */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0c0c0c] border-l border-[#222222] h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-emerald-400" />
                <span className="font-semibold text-sm text-white">Deployment Logs</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLogs(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-5 overflow-auto font-mono text-xs space-y-1.5 text-neutral-300 bg-black selection:bg-white selection:text-black">
              <p className="text-neutral-500">[14:22:01.102] Initializing deployment build runner...</p>
              <p className="text-neutral-500">[14:22:01.340] Cloning repository {project.repository} ({deployment.branch})...</p>
              <p className="text-neutral-500">[14:22:02.012] Installing dependencies with &quot;npm install&quot;...</p>
              <p className="text-neutral-400">[14:22:03.450] Running &quot;npm run build&quot;...</p>
              <p className="text-emerald-400 font-semibold">[14:22:04.110] &gt; vite v5.4.2 building for production...</p>
              <p className="text-neutral-400">[14:22:05.200] ✓ 42 modules transformed.</p>
              <p className="text-neutral-400">[14:22:06.120] dist/index.html                     0.45 kB │ gzip: 0.30 kB</p>
              <p className="text-neutral-400">[14:22:06.880] dist/assets/index-38c29b12.js       142.12 kB │ gzip: 46.80 kB</p>
              <p className="text-emerald-400 font-semibold">[14:22:07.010] ✓ Built in 2.89s</p>
              <p className="text-neutral-400">[14:22:07.240] Uploading build output to global edge mesh...</p>
              <p className="text-neutral-300">[14:22:07.890] Assigning primary domain: {primaryDomain}</p>
              <p className="text-neutral-300">[14:22:08.012] Assigning branch domain: {branchDomain}</p>
              <p className="text-emerald-400 font-bold">[14:22:08.200] ✓ Deployment ready in {deployment.duration || '6s'}.</p>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-[#1c1c1c] flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>Cluster: us-east (Edge CDN)</span>
              <button
                type="button"
                onClick={() => setShowLogs(false)}
                className="bg-white text-black font-semibold px-4 py-1.5 rounded text-xs hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Delete Project Confirmation Modal ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs">
          <div className="max-w-md w-full border border-red-500/40 bg-[#0c0c0c] p-6 space-y-4 shadow-2xl rounded-lg">
            <div className="flex items-center gap-2 text-red-400 font-bold uppercase">
              <AlertTriangle size={16} />
              <span>Confirm Project Deletion</span>
            </div>
            <p className="text-neutral-400 font-sans leading-relaxed">
              This will permanently delete project <strong className="text-white">{project.name}</strong> ({project.id}) and all of its associated deployments and settings. This action cannot be undone.
            </p>
            <div className="space-y-1.5">
              <label className="block text-neutral-400">
                Type <strong className="text-white">{project.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmDeleteName}
                onChange={(e) => setConfirmDeleteName(e.target.value)}
                placeholder={project.name}
                className="w-full bg-black border border-[#222222] px-3 py-2 text-white outline-none focus:border-red-500/60 rounded"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmDeleteName('');
                }}
                className="px-3 py-1.5 border border-[#222222] text-neutral-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmDeleteName !== project.name}
                onClick={handleDeleteProject}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 font-bold uppercase rounded transition-colors cursor-pointer"
              >
                Permanently Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
