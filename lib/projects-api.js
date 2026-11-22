'use client';

/**
 * KR0N ServiceManager Client Module
 *
 * Deep module placed at the `/api/v1` seam for ServiceManagerService:
 * - `GET /api/v1/presets`
 * - `POST /api/v1/orgs/{org_id}/projects`
 * - `GET /api/v1/orgs/{org_id}/projects`
 * - `GET /api/v1/orgs/{org_id}/projects/{project_id}`
 * - `PATCH /api/v1/orgs/{org_id}/projects/{project_id}`
 * - `PUT /api/v1/orgs/{org_id}/projects/{project_id}/build-settings`
 * - `DELETE /api/v1/orgs/{org_id}/projects/{project_id}`
 */

import { apiRequest } from './auth.js';

export function normalizeRootDirectory(rawDir) {
  if (!rawDir || typeof rawDir !== 'string') return './';
  const trimmed = rawDir.trim().replace(/\\/g, '/');
  if (!trimmed || trimmed === '.' || trimmed === '/' || trimmed === './') {
    return './';
  }
  const stripped = trimmed.replace(/^\.?\//, '').replace(/\/+$/, '');
  return stripped ? `./${stripped}` : './';
}

export function buildBuildSettingsPayload({
  installOverride = false,
  customInstallCommand = '',
  buildOverride = false,
  customBuildCommand = '',
  outputOverride = false,
  customOutputDir = '',
} = {}) {
  return {
    install_command: installOverride ? String(customInstallCommand ?? '').trim() : '',
    install_command_override: Boolean(installOverride),
    build_command: buildOverride ? String(customBuildCommand ?? '').trim() : '',
    build_command_override: Boolean(buildOverride),
    output_directory: outputOverride ? String(customOutputDir ?? '').trim() : '',
    output_directory_override: Boolean(outputOverride),
  };
}

export function normalizePreset(rawPreset) {
  if (!rawPreset || typeof rawPreset !== 'object') return null;
  const displayName = rawPreset.display_name || rawPreset.name || rawPreset.id || 'Custom';
  const installCommand =
    rawPreset.default_install_command ?? rawPreset.installCommand ?? '';
  const buildCommand =
    rawPreset.default_build_command ?? rawPreset.buildCommand ?? '';
  const outputDir =
    rawPreset.default_output_directory ?? rawPreset.outputDir ?? '';

  return {
    id: rawPreset.id,
    display_name: displayName,
    name: displayName,
    railpack_provider: rawPreset.railpack_provider || rawPreset.id,
    category: rawPreset.category || 'auto',
    default_install_command: installCommand,
    installCommand,
    default_build_command: buildCommand,
    buildCommand,
    default_output_directory: outputDir,
    outputDir,
  };
}

export function normalizeProject(rawProject, index = 0) {
  if (!rawProject || typeof rawProject !== 'object') return null;
  const repoOwner = rawProject.repo_owner || '';
  const repoName = rawProject.repo_name || '';
  const repoFullName =
    rawProject.repo_full_name ||
    (repoOwner && repoName ? `${repoOwner}/${repoName}` : rawProject.repository || '');
  const productionBranch = rawProject.production_branch || rawProject.branch || 'main';
  const rootDirectory = normalizeRootDirectory(
    rawProject.root_directory || rawProject.rootDir || './'
  );
  const applicationPreset = rawProject.application_preset || rawProject.preset || 'auto';
  const buildSettings = rawProject.build_settings || {
    install_command: '',
    install_command_override: false,
    build_command: '',
    build_command_override: false,
    output_directory: '',
    output_directory_override: false,
    effective_install_command: '',
    effective_build_command: '',
    effective_output_directory: '',
    updated_at: null,
  };
  const effectiveBuildSettings = rawProject.effective_build_settings || {
    install_command:
      buildSettings.effective_install_command ??
      (buildSettings.install_command_override ? buildSettings.install_command : '') ??
      '',
    build_command:
      buildSettings.effective_build_command ??
      (buildSettings.build_command_override ? buildSettings.build_command : '') ??
      '',
    output_directory:
      buildSettings.effective_output_directory ??
      (buildSettings.output_directory_override ? buildSettings.output_directory : '') ??
      '',
  };

  return {
    ...rawProject,
    id: rawProject.id,
    org_id: rawProject.org_id || '',
    name: rawProject.name || 'untitled',
    slug: rawProject.slug || rawProject.name || 'untitled',
    description: rawProject.description || '',
    github_installation_id: Number(rawProject.github_installation_id || 0),
    repo_id: Number(rawProject.repo_id || 0),
    repo_owner: repoOwner,
    repo_name: repoName,
    repo_full_name: repoFullName,
    repository: repoFullName,
    production_branch: productionBranch,
    branch: productionBranch,
    root_directory: rootDirectory,
    rootDir: rootDirectory,
    application_preset: applicationPreset,
    preset: applicationPreset,
    build_settings: buildSettings,
    effective_build_settings: effectiveBuildSettings,
    revision: Number(rawProject.revision ?? 1),
    created_at: rawProject.created_at || null,
    updated_at: rawProject.updated_at || null,
    // Derived UI properties for workspace cards without mock runtime metrics
    index: String(index + 1).padStart(2, '0'),
    status: 'healthy',
    environment: 'production',
    services: Array.isArray(rawProject.services) ? rawProject.services : [],
    currentDeployment: {
      status: 'live',
      version: `rev ${Number(rawProject.revision ?? 1)}`,
      branch: productionBranch,
      commit: applicationPreset,
      timestamp: rawProject.updated_at
        ? new Date(rawProject.updated_at).toLocaleDateString()
        : 'Configured',
    },
    resources: {
      cpu: 0,
      memory: '—',
    },
  };
}

export function createProjectsApi({ requestFn = apiRequest } = {}) {
  async function getPresets() {
    const data = await requestFn('/api/v1/presets', {
      method: 'GET',
      skipRefresh: true,
    });
    const list = Array.isArray(data?.presets) ? data.presets : [];
    return list.map(normalizePreset).filter(Boolean);
  }

  async function listProjects(orgId, { limit = 50, offset = 0 } = {}) {
    if (!orgId) return [];
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const data = await requestFn(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects?${query.toString()}`
    );
    const list = Array.isArray(data?.projects) ? data.projects : [];
    return list.map((p, idx) => normalizeProject(p, idx)).filter(Boolean);
  }

  async function getProject(orgId, projectId) {
    if (!orgId || !projectId) {
      throw new Error('Organization ID and Project ID are required.');
    }
    const data = await requestFn(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}`
    );
    return normalizeProject(data?.project || data);
  }

  async function createProject(orgId, payload = {}) {
    if (!orgId) {
      throw new Error('Organization ID is required to create a project.');
    }
    const body = {
      name: (payload.name || '').trim(),
      slug: (payload.slug || '').trim(),
      description: (payload.description || '').trim(),
      github_installation_id: Number(payload.github_installation_id || 0),
      repo_id: Number(payload.repo_id || 0),
      repo_owner: (payload.repo_owner || '').trim(),
      repo_name: (payload.repo_name || '').trim(),
      production_branch: (payload.production_branch || 'main').trim() || 'main',
      root_directory: normalizeRootDirectory(payload.root_directory || './'),
      application_preset: (payload.application_preset || 'auto').trim(),
      build_settings: payload.build_settings || buildBuildSettingsPayload(payload),
    };

    const data = await requestFn(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects`,
      {
        method: 'POST',
        body,
      }
    );
    return normalizeProject(data?.project || data);
  }

  async function updateProject(orgId, projectId, patch = {}) {
    if (!orgId || !projectId) {
      throw new Error('Organization ID and Project ID are required.');
    }
    const body = {
      name: (patch.name || '').trim(),
      description: (patch.description ?? '').trim(),
      production_branch: (patch.production_branch || 'main').trim(),
      root_directory: normalizeRootDirectory(patch.root_directory || './'),
      application_preset: (patch.application_preset || 'auto').trim(),
      expected_revision: Number(patch.expected_revision || 0),
    };

    const data = await requestFn(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}`,
      {
        method: 'PATCH',
        body,
      }
    );
    return normalizeProject(data?.project || data);
  }

  async function updateProjectBuildSettings(orgId, projectId, { build_settings, expected_revision } = {}) {
    if (!orgId || !projectId) {
      throw new Error('Organization ID and Project ID are required.');
    }
    const data = await requestFn(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/build-settings`,
      {
        method: 'PUT',
        body: {
          build_settings,
          expected_revision: Number(expected_revision || 0),
        },
      }
    );
    return normalizeProject(data?.project || data);
  }

  async function deleteProject(orgId, projectId) {
    if (!orgId || !projectId) {
      throw new Error('Organization ID and Project ID are required.');
    }
    return requestFn(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  return {
    getPresets,
    listProjects,
    getProject,
    createProject,
    updateProject,
    updateProjectBuildSettings,
    deleteProject,
  };
}

export const projectsApi = createProjectsApi();

export const getPresets = (...args) => projectsApi.getPresets(...args);
export const listProjects = (...args) => projectsApi.listProjects(...args);
export const getProject = (...args) => projectsApi.getProject(...args);
export const createProject = (...args) => projectsApi.createProject(...args);
export const updateProject = (...args) => projectsApi.updateProject(...args);
export const updateProjectBuildSettings = (...args) =>
  projectsApi.updateProjectBuildSettings(...args);
export const deleteProject = (...args) => projectsApi.deleteProject(...args);
