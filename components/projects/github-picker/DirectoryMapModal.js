'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Folder,
  FolderOpen,
  FolderTree,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Check,
  X,
} from 'lucide-react';
import { APPLICATION_PRESETS, RepoIcon } from './constants';

function normalizePath(p) {
  if (!p) return './';
  const trimmed = p.trim();
  if (trimmed === '' || trimmed === '.' || trimmed === './' || trimmed === '/') {
    return './';
  }
  return trimmed.startsWith('./') ? trimmed : `./${trimmed.replace(/^\/+/, '')}`;
}

export function buildDirectoryTree(directories = [], dirEntries = []) {
  const root = {
    id: 'root',
    name: './',
    label: './ (repository root)',
    path: './',
    children: [],
    detectedPreset: '',
  };

  const nodeMap = new Map();
  nodeMap.set('', root);
  nodeMap.set('.', root);
  nodeMap.set('./', root);
  nodeMap.set('/', root);

  const entryPresetMap = new Map();
  if (Array.isArray(dirEntries)) {
    dirEntries.forEach((e) => {
      const p = normalizePath(e.path);
      const preset = e.detected_preset || e.detectedPreset || '';
      if (preset) {
        entryPresetMap.set(p, preset);
        entryPresetMap.set(e.path, preset);
      }
    });
  }

  if (entryPresetMap.has('./') || entryPresetMap.has('/')) {
    root.detectedPreset = entryPresetMap.get('./') || entryPresetMap.get('/') || '';
  }

  const cleanPaths = (directories || [])
    .map((d) => (typeof d === 'string' ? d.trim() : ''))
    .filter((d) => d && d !== '.' && d !== './' && d !== '/');

  cleanPaths.sort((a, b) => {
    const aCount = a.replace(/^\.?\//, '').split('/').length;
    const bCount = b.replace(/^\.?\//, '').split('/').length;
    if (aCount !== bCount) return aCount - bCount;
    return a.localeCompare(b);
  });

  cleanPaths.forEach((rawPath) => {
    const stripped = rawPath.replace(/^\.?\//, '').replace(/\/$/, '');
    if (!stripped) return;

    const segments = stripped.split('/');
    let currentKey = '';
    let parent = root;

    segments.forEach((seg, index) => {
      currentKey = currentKey ? `${currentKey}/${seg}` : seg;
      let node = nodeMap.get(currentKey);

      if (!node) {
        const isLeaf = index === segments.length - 1;
        const nodePath = isLeaf ? rawPath : rawPath.startsWith('./') ? `./${currentKey}` : `/${currentKey}`;
        const norm = normalizePath(nodePath);

        node = {
          id: currentKey,
          name: seg,
          label: seg,
          path: nodePath,
          children: [],
          detectedPreset: entryPresetMap.get(norm) || entryPresetMap.get(nodePath) || '',
        };
        nodeMap.set(currentKey, node);
        parent.children.push(node);
      }
      parent = node;
    });
  });

  function sortTree(n) {
    if (n.children && n.children.length > 0) {
      n.children.sort((a, b) => a.name.localeCompare(b.name));
      n.children.forEach(sortTree);
    }
  }
  sortTree(root);

  return root;
}

export function getInitialExpandedPaths(selectedDir) {
  const expanded = new Set(['./', 'root', '/']);
  if (!selectedDir || selectedDir === './' || selectedDir === '/') {
    return expanded;
  }
  const stripped = selectedDir.replace(/^\.?\//, '').replace(/\/$/, '');
  const segments = stripped.split('/');
  let currentKey = '';
  segments.forEach((seg) => {
    currentKey = currentKey ? `${currentKey}/${seg}` : seg;
    expanded.add(currentKey);
    expanded.add(`/${currentKey}`);
    expanded.add(`./${currentKey}`);
  });
  return expanded;
}

export default function DirectoryMapModal({
  onClose,
  repoName,
  branch,
  rootNode,
  dirEntries = [],
  directories = [],
  selectedDir,
  onSelectDir,
  defaultPresetId = 'auto',
  repoLanguage = '',
  availablePresets = APPLICATION_PRESETS,
}) {
  const [tempSelected, setTempSelected] = useState(selectedDir || './');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const treeRoot = useMemo(() => {
    if (rootNode && rootNode.children && rootNode.children.length > 0) {
      return rootNode;
    }
    return buildDirectoryTree(directories, dirEntries);
  }, [rootNode, directories, dirEntries]);

  const [expandedPaths, setExpandedPaths] = useState(() =>
    getInitialExpandedPaths(selectedDir)
  );

  function inferPresetFallback(path) {
    const norm = normalizePath(path);
    if (norm === './') {
      return defaultPresetId && defaultPresetId !== 'auto' ? defaultPresetId : '';
    }

    const lower = norm.toLowerCase();

    if (lower.includes('next')) return 'nextjs';
    if (lower.includes('nuxt')) return 'nuxt';
    if (lower.includes('svelte')) return 'sveltekit';
    if (lower.includes('astro')) return 'astro';
    if (lower.includes('remix')) return 'remix';
    if (lower.includes('vite')) return 'vite';
    if (lower.includes('vue')) return 'vue';
    if (lower.includes('django') || lower.includes('flask') || lower.includes('fastapi')) return 'python';
    if (lower.includes('golang') || lower.includes('go-')) return 'go';
    if (lower.includes('cargo') || lower.includes('rust')) return 'rust';
    if (lower.includes('rails') || lower.includes('ruby')) return 'ruby';
    if (lower.includes('laravel') || lower.includes('php')) return 'php';
    if (lower.includes('spring') || lower.includes('java')) return 'java';
    if (lower.includes('dotnet') || lower.includes('csharp')) return 'dotnet';
    if (lower.includes('docker')) return 'dockerfile';

    if (lower.endsWith('/web') || lower.endsWith('/frontend') || lower.endsWith('/client') || lower.endsWith('/ui')) {
      return 'nextjs';
    }

    if (lower.endsWith('/api') || lower.endsWith('/backend') || lower.endsWith('/server') || lower.endsWith('/service')) {
      const l = (repoLanguage || '').toLowerCase();
      if (l === 'go') return 'go';
      if (l === 'python') return 'python';
      if (l === 'rust') return 'rust';
      if (l === 'ruby') return 'ruby';
      if (l === 'php') return 'php';
      if (l === 'java') return 'java';
      if (l === 'c#') return 'dotnet';
      return 'nodejs';
    }

    if (
      lower.includes('/docs') ||
      lower.includes('/assets') ||
      lower.includes('/images') ||
      lower.includes('/scripts') ||
      lower.includes('/public') ||
      lower.includes('/tests') ||
      lower.includes('/spec') ||
      lower.includes('/pkg') ||
      lower.includes('/internal')
    ) {
      return '';
    }

    return '';
  }

  const presetByPath = useMemo(() => {
    const map = new Map();

    if (Array.isArray(dirEntries)) {
      dirEntries.forEach((e) => {
        const p = normalizePath(e.path);
        const preset = e.detected_preset || e.detectedPreset || '';
        if (preset) {
          map.set(p, preset);
          map.set(e.path, preset);
        }
      });
    }

    function collectFromTree(n) {
      if (!n) return;
      const p = normalizePath(n.path);
      const pr = n.detected_preset || n.detectedPreset || '';
      if (pr && !map.has(p)) {
        map.set(p, pr);
        map.set(n.path, pr);
      }
      if (n.children) {
        n.children.forEach(collectFromTree);
      }
    }
    collectFromTree(treeRoot);

    return map;
  }, [dirEntries, treeRoot]);

  function getDetectedPreset(path) {
    const norm = normalizePath(path);
    if (presetByPath.has(norm)) return presetByPath.get(norm);
    if (presetByPath.has(path)) return presetByPath.get(path);
    return inferPresetFallback(path);
  }

  function toggleExpand(node, e) {
    if (e) e.stopPropagation();
    const key = node.path;
    const idKey = node.id;
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      const isCurrentlyExpanded = next.has(key) || (idKey && next.has(idKey));
      if (isCurrentlyExpanded) {
        next.delete(key);
        if (idKey) next.delete(idKey);
      } else {
        next.add(key);
        if (idKey) next.add(idKey);
      }
      return next;
    });
  }

  function handleCollapseAll() {
    setExpandedPaths(new Set(['./', 'root', '/']));
  }

  function handleExpandAll() {
    const all = new Set(['./', 'root', '/']);
    function collect(n) {
      if (n.path) all.add(n.path);
      if (n.id) all.add(n.id);
      if (n.children) n.children.forEach(collect);
    }
    collect(treeRoot);
    setExpandedPaths(all);
  }

  function handleConfirm() {
    const detected = getDetectedPreset(tempSelected);
    onSelectDir(tempSelected, detected);
    onClose();
  }

  const filteredDirs = searchQuery.trim()
    ? (directories || []).filter((d) =>
        d.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  const tempNorm = normalizePath(tempSelected);
  const selectedPresetId = getDetectedPreset(tempNorm);
  const selectedPresetSpec = availablePresets.find((p) => p.id === selectedPresetId);

  function renderPresetBadge(path) {
    const presetId = getDetectedPreset(path);
    if (presetId) {
      const spec = availablePresets.find((p) => p.id === presetId);
      return (
        <div className='flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-kr0n-surface-2 border border-kr0n-line text-[11px] text-kr0n-text shrink-0'>
          <RepoIcon type={presetId} />
          <span className='font-sans font-medium'>{spec?.name || presetId}</span>
        </div>
      );
    }
    return null;
  }

  function renderTreeNode(node, depth = 0) {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path) || (node.id && expandedPaths.has(node.id));
    const isSelected =
      tempSelected === node.path ||
      normalizePath(tempSelected) === normalizePath(node.path);

    const isRoot = node.id === 'root' || node.path === './' || node.path === '/';

    return (
      <div key={node.path || node.id} className='select-none'>
        <div
          onClick={() => {
            setTempSelected(node.path);
            if (hasChildren && !isExpanded) {
              setExpandedPaths((prev) => new Set([...prev, node.path, node.id || '']));
            }
          }}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2.5 rounded-lg cursor-pointer text-xs font-mono transition-colors duration-150 ${
            isSelected
              ? 'bg-kr0n-surface-2 text-kr0n-text border border-kr0n-line-strong'
              : 'text-kr0n-text-secondary hover:bg-kr0n-surface-2/60 hover:text-kr0n-text border border-transparent'
          }`}
        >
          <div className='flex items-center gap-2 truncate min-w-0 mr-2'>
            {hasChildren ? (
              <button
                type='button'
                onClick={(e) => toggleExpand(node, e)}
                className='w-5 h-5 flex items-center justify-center rounded hover:bg-kr0n-surface-3 text-kr0n-muted hover:text-kr0n-text shrink-0 transition-colors duration-150 cursor-pointer'
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className='w-5 shrink-0' />
            )}

            {isRoot ? (
              <FolderTree size={14} className='text-kr0n-text-secondary shrink-0' />
            ) : isExpanded ? (
              <FolderOpen size={14} className='text-amber-400 shrink-0' />
            ) : (
              <Folder size={14} className='text-kr0n-muted shrink-0' />
            )}

            <span className={`truncate ${isSelected ? 'text-kr0n-text font-medium' : ''}`}>
              {isRoot ? './ (repository root)' : node.name}
            </span>

            {hasChildren && !isExpanded && (
              <span className='text-[11px] text-kr0n-muted font-sans px-1.5 py-0.5 rounded bg-kr0n-black border border-kr0n-line-soft shrink-0'>
                {node.children.length}
              </span>
            )}
          </div>

          <div className='flex items-center gap-2 shrink-0 ml-2'>
            {renderPresetBadge(node.path)}
            {isSelected && <Check size={13} className='text-kr0n-text shrink-0' />}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className='border-l border-kr0n-line-soft ml-3.5 space-y-0.5 mt-0.5'>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Select root directory'
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-kr0n-surface border border-kr0n-line rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='p-4 border-b border-kr0n-line flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='w-8 h-8 rounded-lg bg-kr0n-black border border-kr0n-line flex items-center justify-center text-kr0n-text shrink-0'>
              <FolderTree size={15} />
            </div>
            <div className='min-w-0'>
              <h2 className='text-sm font-semibold text-kr0n-text'>Select root directory</h2>
              <p className='text-xs text-kr0n-muted flex items-center gap-1.5 font-mono truncate'>
                <span className='truncate'>{repoName}</span>
                <span>·</span>
                <GitBranch size={11} className='shrink-0' />
                <span>{branch}</span>
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close dialog'
            className='text-kr0n-muted hover:text-kr0n-text p-1.5 rounded-md hover:bg-kr0n-surface-2 transition-colors duration-150 cursor-pointer'
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className='p-3 border-b border-kr0n-line-soft bg-kr0n-canvas-raised'>
          <div className='relative'>
            <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-kr0n-muted' />
            <input
              type='text'
              placeholder='Search directories...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full h-9 bg-kr0n-black border border-kr0n-line focus:border-kr0n-accent rounded-lg pl-8.5 pr-3 text-xs text-kr0n-text placeholder:text-kr0n-faint outline-none font-mono'
            />
          </div>
        </div>

        {/* Explorer bar */}
        {!searchQuery.trim() && (
          <div className='px-4 py-2 border-b border-kr0n-line-soft bg-kr0n-black flex items-center justify-between text-xs text-kr0n-muted'>
            <span className='font-mono text-kr0n-text-secondary truncate max-w-[240px]'>
              {tempSelected}
            </span>

            <div className='flex items-center gap-2 shrink-0'>
              <button
                type='button'
                onClick={handleCollapseAll}
                className='text-kr0n-muted hover:text-kr0n-text px-1.5 py-0.5 rounded hover:bg-kr0n-surface transition-colors duration-150 cursor-pointer'
              >
                Collapse all
              </button>
              <span className='text-kr0n-line'>·</span>
              <button
                type='button'
                onClick={handleExpandAll}
                className='text-kr0n-muted hover:text-kr0n-text px-1.5 py-0.5 rounded hover:bg-kr0n-surface transition-colors duration-150 cursor-pointer'
              >
                Expand all
              </button>
            </div>
          </div>
        )}

        {/* Tree */}
        <div className='p-3 overflow-y-auto max-h-[380px] space-y-0.5'>
          {searchQuery.trim() ? (
            filteredDirs.length === 0 ? (
              <div className='py-8 text-center text-xs text-kr0n-muted'>
                No directories matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredDirs.map((dir) => {
                const isSelected =
                  tempSelected === dir ||
                  normalizePath(tempSelected) === normalizePath(dir);
                const parts = dir.replace(/^\.?\//, '').split('/');
                return (
                  <div
                    key={dir}
                    onClick={() => {
                      setTempSelected(dir);
                      setSearchQuery('');
                      const ancestors = getInitialExpandedPaths(dir);
                      setExpandedPaths((prev) => new Set([...prev, ...ancestors]));
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-mono transition-colors duration-150 ${
                      isSelected
                        ? 'bg-kr0n-surface-2 text-kr0n-text border border-kr0n-line-strong'
                        : 'text-kr0n-text-secondary hover:bg-kr0n-surface-2/60 hover:text-kr0n-text border border-transparent'
                    }`}
                  >
                    <div className='flex items-center gap-2 truncate min-w-0 mr-2'>
                      <Folder size={14} className='text-amber-400 shrink-0' />
                      <div className='truncate'>
                        {parts.length > 1 && (
                          <span className='text-kr0n-muted'>
                            {parts.slice(0, -1).join('/')}/
                          </span>
                        )}
                        <span className='text-kr0n-text font-medium'>
                          {parts[parts.length - 1] || dir}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 shrink-0 ml-2'>
                      {renderPresetBadge(dir)}
                      {isSelected && <Check size={13} className='text-kr0n-text shrink-0' />}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            renderTreeNode(treeRoot)
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-kr0n-line bg-kr0n-canvas-raised flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='text-xs truncate flex items-center gap-2 min-w-0'>
            <code className='text-kr0n-text font-mono bg-kr0n-black px-2 py-0.5 rounded-md border border-kr0n-line truncate'>
              {tempSelected}
            </code>
            {selectedPresetSpec && (
              <span className='inline-flex items-center gap-1.5 text-xs text-kr0n-healthy bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0'>
                <RepoIcon type={selectedPresetSpec.id} />
                <span>{selectedPresetSpec.name}</span>
              </span>
            )}
          </div>
          <div className='flex items-center gap-2 shrink-0 justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='h-8 px-3 rounded-lg text-xs font-medium text-kr0n-muted hover:text-kr0n-text hover:bg-kr0n-surface-2 transition-colors duration-150 cursor-pointer'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleConfirm}
              className='h-8 px-4 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black font-medium text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 cursor-pointer'
            >
              Select directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
