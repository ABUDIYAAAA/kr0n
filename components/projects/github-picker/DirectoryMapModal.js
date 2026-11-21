'use client';

import { useState } from 'react';
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

export function buildDirectoryTree(directories = []) {
  const root = {
    id: 'root',
    name: './',
    label: './ (repository root)',
    path: './',
    children: [],
  };

  const nodeMap = new Map();
  nodeMap.set('', root);
  nodeMap.set('.', root);
  nodeMap.set('./', root);
  nodeMap.set('/', root);

  const cleanPaths = (directories || [])
    .map((d) => (typeof d === 'string' ? d.trim() : ''))
    .filter((d) => d && d !== '.' && d !== './' && d !== '/');

  // Sort by segment depth so parents are created before children
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
        const nodePath = isLeaf ? rawPath : (rawPath.startsWith('./') ? `./${currentKey}` : `/${currentKey}`);

        node = {
          id: currentKey,
          name: seg,
          label: seg,
          path: nodePath,
          children: [],
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
  directories = [],
  selectedDir,
  onSelectDir,
}) {
  const [tempSelected, setTempSelected] = useState(selectedDir || './');
  const [searchQuery, setSearchQuery] = useState('');

  // Build hierarchical directory tree from directories list
  const treeRoot = rootNode && rootNode.children && rootNode.children.length > 0
    ? rootNode
    : buildDirectoryTree(directories);

  // Initial expanded state: unfold root and ancestor path of selected directory
  const [expandedPaths, setExpandedPaths] = useState(() =>
    getInitialExpandedPaths(selectedDir)
  );

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
    onSelectDir(tempSelected);
    onClose();
  }

  const filteredDirs = searchQuery.trim()
    ? directories.filter((d) =>
        d.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  function renderTreeNode(node, depth = 0) {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path) || (node.id && expandedPaths.has(node.id));
    const isSelected =
      tempSelected === node.path ||
      (node.path === './' && (tempSelected === './' || tempSelected === '.' || tempSelected === '/'));

    const isRoot = node.id === 'root' || node.path === './' || node.path === '/';

    return (
      <div key={node.path || node.id} className="select-none">
        <div
          onClick={() => {
            setTempSelected(node.path);
            // Slowly unfold: auto-expand this directory when selected so child folders appear
            if (hasChildren && !isExpanded) {
              setExpandedPaths((prev) => new Set([...prev, node.path, node.id || '']));
            }
          }}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2.5 rounded-md cursor-pointer text-xs font-mono transition-colors group ${
            isSelected
              ? 'bg-white/10 text-white font-medium border border-white/20'
              : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate min-w-0">
            {/* Dropdown Chevron Toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node, e)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-neutral-400 hover:text-white shrink-0 transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown size={13} className="text-neutral-300" />
                ) : (
                  <ChevronRight size={13} className="text-neutral-400" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            {/* Folder Icon */}
            {isRoot ? (
              <FolderTree size={14} className="text-neutral-300 shrink-0" />
            ) : isExpanded ? (
              <FolderOpen size={14} className="text-amber-400 shrink-0" />
            ) : (
              <Folder size={14} className="text-neutral-400 shrink-0" />
            )}

            {/* Folder Name */}
            <span className={`truncate ${isSelected ? 'text-white font-bold' : ''}`}>
              {isRoot ? './ (repository root)' : node.name}
            </span>

            {/* Subfolders counter when folded */}
            {hasChildren && !isExpanded && (
              <span className="text-[10px] text-neutral-500 font-sans px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 shrink-0">
                {node.children.length} {node.children.length === 1 ? 'dir' : 'dirs'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {!isRoot && (
              <span className="text-[10px] text-neutral-500 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                {node.path}
              </span>
            )}
            {isSelected && <Check size={13} className="text-white shrink-0" />}
          </div>
        </div>

        {/* Unfolded Subdirectories */}
        {hasChildren && isExpanded && (
          <div className="border-l border-neutral-800/80 ml-3.5 space-y-0.5 mt-0.5">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
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

        {/* Explorer Controls Bar */}
        {!searchQuery.trim() && (
          <div className="px-3.5 py-1.5 border-b border-[#1c1c1c] bg-[#0a0a0a] flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-neutral-500">Explorer:</span>
              <span className="text-neutral-300 truncate max-w-[220px]">
                {tempSelected}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Collapse all
              </button>
              <span className="text-neutral-700">|</span>
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Expand all
              </button>
            </div>
          </div>
        )}

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
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-white/10 text-white font-medium border border-white/20'
                        : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder size={14} className="text-amber-400 shrink-0" />
                      <div className="truncate">
                        {parts.length > 1 && (
                          <span className="text-neutral-500">
                            {parts.slice(0, -1).join('/')}/
                          </span>
                        )}
                        <span className="text-white font-medium">
                          {parts[parts.length - 1] || dir}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={13} className="text-white shrink-0" />}
                  </div>
                );
              })
            )
          ) : (
            renderTreeNode(treeRoot)
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
