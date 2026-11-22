'use client';

/**
 * KR0N Shared Workspace Context Module
 *
 * Deep module synchronizing active user, organizations, activeOrg, and RBAC roles
 * across AppShell, Settings, GitHubProjectPicker, and project views.
 */

import { useEffect, useSyncExternalStore } from 'react';
import {
  getOrganizations,
  createOrganization as apiCreateOrganization,
  updateOrganization as apiUpdateOrganization,
  deleteOrganization as apiDeleteOrganization,
  getRoles,
  useAuthUser,
  validateDisplayNamePolicy,
} from './auth.js';

const ACTIVE_ORG_STORAGE_KEY = 'kr0n_active_org_id';
const ORG_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyOrgName(name) {
  if (typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
}

export function validateOrgSlugPolicy(slug) {
  if (typeof slug !== 'string') {
    return { valid: false, error: 'Organization slug is required.' };
  }
  const trimmed = slug.trim();
  if (trimmed.length < 2 || trimmed.length > 63) {
    return {
      valid: false,
      error: 'Organization slug must be between 2 and 63 characters.',
    };
  }
  if (!ORG_SLUG_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        'Slug may only contain lowercase letters, numbers, and single hyphens between words.',
    };
  }
  return { valid: true, error: null };
}

export function createWorkspaceStore({
  authApi = {
    getOrganizations,
    createOrganization: apiCreateOrganization,
    updateOrganization: apiUpdateOrganization,
    deleteOrganization: apiDeleteOrganization,
    getRoles,
  },
  storage = typeof window !== 'undefined' && typeof localStorage !== 'undefined'
    ? localStorage
    : null,
} = {}) {
  const listeners = new Set();
  let inFlightLoad = null;

  let state = {
    organizations: [],
    activeOrgId: storage?.getItem?.(ACTIVE_ORG_STORAGE_KEY) || null,
    activeOrg: null,
    roles: [],
    isLoading: false,
    hasLoaded: false,
    loadedForUserId: null,
    error: null,
  };

  function resolveActiveOrg(orgs, candidateId) {
    if (!Array.isArray(orgs) || orgs.length === 0) {
      return { activeOrg: null, activeOrgId: null };
    }
    const matched = candidateId ? orgs.find((o) => o.id === candidateId) : null;
    const activeOrg = matched || orgs[0];
    return { activeOrg, activeOrgId: activeOrg.id };
  }

  function setState(updater) {
    const nextPartial = typeof updater === 'function' ? updater(state) : updater;
    const nextOrgs = nextPartial.organizations ?? state.organizations;
    const requestedOrgId =
      nextPartial.activeOrgId !== undefined ? nextPartial.activeOrgId : state.activeOrgId;

    const { activeOrg, activeOrgId } = resolveActiveOrg(nextOrgs, requestedOrgId);

    if (activeOrgId && storage?.setItem) {
      try {
        storage.setItem(ACTIVE_ORG_STORAGE_KEY, activeOrgId);
      } catch {
        // Ignore storage quota errors
      }
    }

    state = {
      ...state,
      ...nextPartial,
      organizations: nextOrgs,
      activeOrgId,
      activeOrg,
    };

    for (const listener of listeners) {
      listener();
    }
  }

  async function loadWorkspace({ force = false, userId = null } = {}) {
    if (!force && inFlightLoad) {
      return inFlightLoad;
    }

    setState({ isLoading: true, error: null });

    inFlightLoad = (async () => {
      try {
        const storedId =
          storage?.getItem?.(ACTIVE_ORG_STORAGE_KEY) || state.activeOrgId;
        const [orgs, roles] = await Promise.all([
          authApi.getOrganizations(),
          authApi.getRoles ? authApi.getRoles().catch(() => []) : Promise.resolve([]),
        ]);

        setState({
          organizations: Array.isArray(orgs) ? orgs : [],
          activeOrgId: storedId,
          roles: Array.isArray(roles) && roles.length > 0 ? roles : state.roles,
          isLoading: false,
          hasLoaded: true,
          loadedForUserId: userId ?? state.loadedForUserId,
          error: null,
        });
        return state;
      } catch (err) {
        setState({
          isLoading: false,
          hasLoaded: true,
          loadedForUserId: userId ?? state.loadedForUserId,
          error: err?.message || 'Failed to load workspace organizations.',
        });
        throw err;
      } finally {
        inFlightLoad = null;
      }
    })();

    return inFlightLoad;
  }

  function setActiveOrgId(orgId) {
    if (!orgId) return;
    setState({ activeOrgId: orgId });
  }

  async function createOrganization(name, rawSlug) {
    const nameCheck = validateDisplayNamePolicy(name);
    if (!nameCheck.valid) {
      throw new Error('Organization name must be between 1 and 100 characters.');
    }
    const slug = (rawSlug ? rawSlug.trim().toLowerCase() : slugifyOrgName(name));
    const slugCheck = validateOrgSlugPolicy(slug);
    if (!slugCheck.valid) {
      throw new Error(slugCheck.error);
    }

    const created = await authApi.createOrganization(name.trim(), slug);
    if (created?.id) {
      const nextOrgs = [
        ...state.organizations.filter((o) => o.id !== created.id),
        created,
      ];
      setState({
        organizations: nextOrgs,
        activeOrgId: created.id,
      });
    }
    return created;
  }

  async function updateOrganization(orgId, name) {
    const nameCheck = validateDisplayNamePolicy(name);
    if (!nameCheck.valid) {
      throw new Error('Organization name must be between 1 and 100 characters.');
    }
    const updated = await authApi.updateOrganization(orgId, name.trim());
    setState({
      organizations: state.organizations.map((org) =>
        org.id === orgId ? { ...org, ...updated, name: updated?.name || name.trim() } : org
      ),
    });
    return updated;
  }

  async function deleteOrganization(orgId) {
    const res = await authApi.deleteOrganization(orgId);
    const remaining = state.organizations.filter((org) => org.id !== orgId);
    const nextActiveId =
      state.activeOrgId === orgId ? (remaining[0]?.id || null) : state.activeOrgId;
    setState({
      organizations: remaining,
      activeOrgId: nextActiveId,
    });
    return res;
  }

  function resetWorkspace() {
    if (storage?.removeItem) {
      try {
        storage.removeItem(ACTIVE_ORG_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    setState({
      organizations: [],
      activeOrgId: null,
      roles: [],
      isLoading: false,
      hasLoaded: false,
      loadedForUserId: null,
      error: null,
    });
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot() {
    return state;
  }

  return {
    subscribe,
    getSnapshot,
    loadWorkspace,
    setActiveOrgId,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    resetWorkspace,
  };
}

export const workspaceStore = createWorkspaceStore();

const SERVER_SNAPSHOT = {
  organizations: [],
  activeOrgId: null,
  activeOrg: null,
  roles: [],
  isLoading: false,
  hasLoaded: false,
  loadedForUserId: null,
  error: null,
};

export function useWorkspace({ autoLoad = true } = {}) {
  const user = useAuthUser();
  const currentUserId = user?.id || user?.user_id || null;
  const snapshot = useSyncExternalStore(
    workspaceStore.subscribe,
    workspaceStore.getSnapshot,
    () => SERVER_SNAPSHOT
  );

  useEffect(() => {
    if (!autoLoad || snapshot.isLoading) return;
    const userChanged =
      currentUserId !== null && snapshot.loadedForUserId !== currentUserId;
    if (!snapshot.hasLoaded || userChanged) {
      workspaceStore
        .loadWorkspace({ force: userChanged, userId: currentUserId })
        .catch(() => {});
    }
  }, [
    autoLoad,
    snapshot.hasLoaded,
    snapshot.isLoading,
    snapshot.loadedForUserId,
    currentUserId,
  ]);

  return {
    user,
    ...snapshot,
    setActiveOrgId: workspaceStore.setActiveOrgId,
    refreshOrganizations: () =>
      workspaceStore.loadWorkspace({ force: true, userId: currentUserId }),
    createOrganization: workspaceStore.createOrganization,
    updateOrganization: workspaceStore.updateOrganization,
    deleteOrganization: workspaceStore.deleteOrganization,
    resetWorkspace: workspaceStore.resetWorkspace,
  };
}
