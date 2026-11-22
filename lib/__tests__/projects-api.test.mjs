import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProjectsApi,
  buildBuildSettingsPayload,
  normalizeProject,
  normalizePreset,
} from '../projects-api.js';
import { createWorkspaceStore } from '../workspace-context.js';

test('buildBuildSettingsPayload preserves intentional empty overrides when override toggle is true', () => {
  const payload = buildBuildSettingsPayload({
    installOverride: true,
    customInstallCommand: '   ',
    buildOverride: true,
    customBuildCommand: 'bun run build',
    outputOverride: false,
    customOutputDir: 'ignored-dir',
  });

  assert.deepEqual(payload, {
    install_command: '',
    install_command_override: true,
    build_command: 'bun run build',
    build_command_override: true,
    output_directory: '',
    output_directory_override: false,
  });

  const normalized = normalizeProject({
    id: 'p_eff',
    name: 'eff-test',
    build_settings: {
      install_command: '',
      install_command_override: false,
      build_command: '',
      build_command_override: false,
      output_directory: '',
      output_directory_override: false,
      effective_install_command: 'npm install',
      effective_build_command: 'npm run build',
      effective_output_directory: '.next',
    },
  });
  assert.deepEqual(normalized.effective_build_settings, {
    install_command: 'npm install',
    build_command: 'npm run build',
    output_directory: '.next',
  });
});

test('createProjectsApi calls all ServiceManagerService endpoints with exact backend contract', async () => {
  const calls = [];
  const api = createProjectsApi({
    requestFn: async (path, options = {}) => {
      calls.push({ path, options });
      if (path === '/api/v1/presets') {
        return {
          presets: [
            {
              id: 'nextjs',
              display_name: 'Next.js',
              railpack_provider: 'node',
              category: 'fullstack',
              default_install_command: 'npm install',
              default_build_command: 'npm run build',
              default_output_directory: '.next',
            },
          ],
        };
      }
      if (path === '/api/v1/orgs/org_1/projects' && options.method === 'POST') {
        return {
          project: {
            id: 'proj_uuid_1',
            org_id: 'org_1',
            name: options.body.name,
            slug: options.body.slug,
            repo_full_name: `${options.body.repo_owner}/${options.body.repo_name}`,
            production_branch: options.body.production_branch,
            root_directory: options.body.root_directory,
            application_preset: options.body.application_preset,
            build_settings: options.body.build_settings,
            effective_build_settings: {
              install_command: 'npm install',
              build_command: '',
              output_directory: '.next',
            },
            revision: 1,
          },
        };
      }
      if (path.startsWith('/api/v1/orgs/org_1/projects?')) {
        return {
          projects: [
            {
              id: 'proj_uuid_1',
              org_id: 'org_1',
              name: 'kr0n-web',
              slug: 'kr0n-web',
              repo_owner: 'kr0n-labs',
              repo_name: 'kr0n-web',
              repo_full_name: 'kr0n-labs/kr0n-web',
              production_branch: 'main',
              root_directory: './',
              application_preset: 'nextjs',
              revision: 1,
            },
          ],
        };
      }
      if (path === '/api/v1/orgs/org_1/projects/proj_uuid_1' && options.method === 'PATCH') {
        return {
          project: {
            id: 'proj_uuid_1',
            org_id: 'org_1',
            name: options.body.name,
            production_branch: options.body.production_branch,
            root_directory: options.body.root_directory,
            application_preset: options.body.application_preset,
            revision: 2,
          },
        };
      }
      if (path === '/api/v1/orgs/org_1/projects/proj_uuid_1/build-settings' && options.method === 'PUT') {
        return {
          project: {
            id: 'proj_uuid_1',
            org_id: 'org_1',
            name: 'kr0n-web-v2',
            build_settings: options.body.build_settings,
            revision: 3,
          },
        };
      }
      if (path === '/api/v1/orgs/org_1/projects/proj_uuid_1' && options.method === 'DELETE') {
        return { message: 'project deleted' };
      }
      return {};
    },
  });

  const presets = await api.getPresets();
  assert.equal(presets.length, 1);
  assert.equal(presets[0].id, 'nextjs');
  assert.equal(presets[0].name, 'Next.js');
  assert.equal(presets[0].buildCommand, 'npm run build');

  const created = await api.createProject('org_1', {
    name: 'kr0n-web',
    github_installation_id: '184229460',
    repo_id: '998877',
    repo_owner: 'kr0n-labs',
    repo_name: 'kr0n-web',
    production_branch: 'develop',
    root_directory: 'apps/web',
    application_preset: 'nextjs',
    build_settings: buildBuildSettingsPayload({
      buildOverride: true,
      customBuildCommand: '',
    }),
  });

  assert.equal(created.id, 'proj_uuid_1');
  const postCall = calls.find((c) => c.options.method === 'POST');
  assert.equal(postCall.options.body.github_installation_id, 184229460);
  assert.equal(postCall.options.body.repo_id, 998877);
  assert.equal(postCall.options.body.root_directory, './apps/web');
  assert.equal(postCall.options.body.production_branch, 'develop');
  assert.equal(postCall.options.body.build_settings.build_command, '');
  assert.equal(postCall.options.body.build_settings.build_command_override, true);

  const list = await api.listProjects('org_1');
  assert.equal(list.length, 1);
  assert.equal(list[0].repo_full_name, 'kr0n-labs/kr0n-web');

  const updated = await api.updateProject('org_1', 'proj_uuid_1', {
    name: 'kr0n-web-v2',
    description: 'Updated description',
    production_branch: 'main',
    root_directory: './',
    application_preset: 'nextjs',
    expected_revision: 1,
  });
  assert.equal(updated.revision, 2);

  const updatedBuild = await api.updateProjectBuildSettings('org_1', 'proj_uuid_1', {
    build_settings: buildBuildSettingsPayload({
      installOverride: true,
      customInstallCommand: 'npm ci',
    }),
    expected_revision: 2,
  });
  assert.equal(updatedBuild.revision, 3);

  const del = await api.deleteProject('org_1', 'proj_uuid_1');
  assert.equal(del.message, 'project deleted');
});

test('createWorkspaceStore loads and mutates org-scoped projects when activeOrgId changes', async () => {
  const projectsByOrg = {
    org_1: [{ id: 'p_1', org_id: 'org_1', name: 'Alpha App', slug: 'alpha-app', revision: 1 }],
    org_2: [{ id: 'p_2', org_id: 'org_2', name: 'Beta App', slug: 'beta-app', revision: 1 }],
  };

  const store = createWorkspaceStore({
    authApi: {
      getOrganizations: async () => [
        { id: 'org_1', name: 'Org 1', slug: 'org-1', role_id: 'owner' },
        { id: 'org_2', name: 'Org 2', slug: 'org-2', role_id: 'admin' },
      ],
      getRoles: async () => [],
    },
    projectsApi: {
      listProjects: async (orgId) => (projectsByOrg[orgId] || []).map(normalizeProject),
      getPresets: async () => [normalizePreset({ id: 'vite', display_name: 'Vite', category: 'frontend' })],
      createProject: async (orgId, payload) =>
        normalizeProject({ id: 'p_3', org_id: orgId, name: payload.name, slug: payload.name, revision: 1 }),
      deleteProject: async () => ({ message: 'deleted' }),
    },
  });

  await store.loadWorkspace();
  assert.equal(store.getSnapshot().projects.length, 1);
  assert.equal(store.getSnapshot().projects[0].id, 'p_1');

  await store.setActiveOrgId('org_2');
  assert.equal(store.getSnapshot().projects.length, 1);
  assert.equal(store.getSnapshot().projects[0].id, 'p_2');

  await store.createProject({ name: 'gamma-app' });
  assert.equal(store.getSnapshot().projects.length, 2);

  await store.deleteProject('p_2');
  assert.equal(store.getSnapshot().projects.length, 1);
  assert.equal(store.getSnapshot().projects[0].id, 'p_3');
});
