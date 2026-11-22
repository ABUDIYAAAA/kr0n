import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspaceStore,
  validateOrgSlugPolicy,
  slugifyOrgName,
} from '../workspace-context.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('createWorkspaceStore loads organizations and roles, persists activeOrgId, and falls back when stored org is absent', async () => {
  const storage = createMemoryStorage();
  storage.setItem('kr0n_active_org_id', 'org_stale');

  const store = createWorkspaceStore({
    storage,
    authApi: {
      getOrganizations: async () => [
        { id: 'org_1', name: 'Alpha', slug: 'alpha', role_id: 'owner' },
        { id: 'org_2', name: 'Beta', slug: 'beta', role_id: 'member' },
      ],
      getRoles: async () => [
        { id: 'owner', name: 'Owner', permissions: ['org:read', 'org:update', 'org:delete'] },
        { id: 'member', name: 'Member', permissions: ['org:read'] },
      ],
    },
  });

  await store.loadWorkspace({ userId: 'usr_1' });
  const snap1 = store.getSnapshot();
  assert.equal(snap1.organizations.length, 2);
  assert.equal(snap1.activeOrgId, 'org_1');
  assert.equal(snap1.activeOrg.name, 'Alpha');
  assert.equal(snap1.roles.length, 2);
  assert.equal(snap1.loadedForUserId, 'usr_1');

  store.setActiveOrgId('org_2');
  const snap2 = store.getSnapshot();
  assert.equal(snap2.activeOrgId, 'org_2');
  assert.equal(snap2.activeOrg.name, 'Beta');
  assert.equal(storage.getItem('kr0n_active_org_id'), 'org_2');
});

test('createWorkspaceStore supports create, update, and delete organization mutations with reactive state updates', async () => {
  const storage = createMemoryStorage();
  let orgs = [{ id: 'org_1', name: 'Alpha', slug: 'alpha', role_id: 'owner' }];

  const store = createWorkspaceStore({
    storage,
    authApi: {
      getOrganizations: async () => orgs,
      getRoles: async () => [],
      createOrganization: async (name, slug) => {
        const created = { id: 'org_2', name, slug, role_id: 'owner' };
        orgs = [...orgs, created];
        return created;
      },
      updateOrganization: async (orgId, name) => {
        const updated = { id: orgId, name, slug: 'gamma-labs', role_id: 'owner' };
        orgs = orgs.map((o) => (o.id === orgId ? updated : o));
        return updated;
      },
      deleteOrganization: async (orgId) => {
        orgs = orgs.filter((o) => o.id !== orgId);
        return { message: 'deleted' };
      },
    },
  });

  await store.loadWorkspace();
  const created = await store.createOrganization('Gamma Labs', 'gamma-labs');
  assert.equal(created.id, 'org_2');
  assert.equal(store.getSnapshot().activeOrgId, 'org_2');
  assert.equal(store.getSnapshot().organizations.length, 2);

  await store.updateOrganization('org_2', 'Gamma Core');
  assert.equal(store.getSnapshot().activeOrg.name, 'Gamma Core');

  await store.deleteOrganization('org_2');
  assert.equal(store.getSnapshot().organizations.length, 1);
  assert.equal(store.getSnapshot().activeOrgId, 'org_1');
});

test('validateOrgSlugPolicy and slugifyOrgName enforce backend 2..63 char slug rules', () => {
  assert.equal(validateOrgSlugPolicy('a').valid, false);
  assert.equal(validateOrgSlugPolicy('-bad').valid, false);
  assert.equal(validateOrgSlugPolicy('bad--slug').valid, false);
  assert.equal(validateOrgSlugPolicy('kr0n-labs-2').valid, true);
  assert.equal(slugifyOrgName('  KR0N_Labs & Co! '), 'kr0n-labs-co');
});
