'use client';

/**
 * KR0N Authentication & Organization Client Module
 *
 * Uses the deep `/api/v1` control-plane transport (`lib/api-client.js`).
 * Session tokens (`access_token`, `refresh_token`) and OAuth PKCE verifiers
 * are stored exclusively in HttpOnly cookies set by the backend gateway.
 */

import { useSyncExternalStore } from 'react';
import {
  createApiClient,
  parseApiError,
  validatePasswordPolicy,
  validateDisplayNamePolicy,
  getSafeRedirect,
} from './api-client.js';

export {
  validatePasswordPolicy,
  validateDisplayNamePolicy,
  getSafeRedirect,
};

export function getBackendUrl() {
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_KR0N_BACKEND_URL ||
      'http://localhost:8080'
    );
  }
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_KR0N_BACKEND_URL ||
    'http://localhost:8080'
  );
}

export function getRedirectUrl() {
  return getSafeRedirect(process.env.NEXT_PUBLIC_REDIRECT_URL, '/dashboard');
}

export function resolveAuthRedirect(searchString) {
  const rawSearch =
    searchString !== undefined
      ? searchString
      : typeof window !== 'undefined'
        ? window.location.search
        : '';
  const search = rawSearch ? new URLSearchParams(rawSearch) : null;
  const rawRedirect = search?.get('redirect');
  if (rawRedirect) {
    return getSafeRedirect(rawRedirect, '/dashboard');
  }
  const targetUrl = getRedirectUrl();
  if (targetUrl && !targetUrl.includes('/callback')) {
    return getSafeRedirect(targetUrl, '/dashboard');
  }
  return '/dashboard';
}

export function getAuthHeaders() {
  return {};
}

const USER_STORAGE_KEY = 'kr0n_auth_user';
const OAUTH_FLOW_SESSION_KEY = 'kr0n_oauth_flow';
const LEGACY_LOCAL_KEYS = [
  'kr0n_auth_tokens',
  'kr0n_oauth_code_verifier',
  'kr0n_google_oauth_code_verifier',
  'kr0n_state_v2.0',
];

let cachedUserRaw = undefined;
let cachedUserParsed = null;

function expireLegacyCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'kr0n_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'kr0n_user=; path=/; max-age=0; SameSite=Lax';
}

function cleanupLegacyStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  for (const key of LEGACY_LOCAL_KEYS) {
    localStorage.removeItem(key);
  }
  expireLegacyCookies();
}

function notifyAuthSubscribers() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('kr0n-auth-change'));
}

export function getStoredUser() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw !== cachedUserRaw) {
      cachedUserRaw = raw;
      cachedUserParsed = raw ? JSON.parse(raw) : null;
    }
    return cachedUserParsed;
  } catch {
    return null;
  }
}

export function getStoredTokens() {
  const user = getStoredUser();
  if (!user) return null;
  return {
    accessToken: 'cookie-session',
    refreshToken: null,
  };
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const displayName = user.display_name || user.displayName || '';
  return {
    ...user,
    id: user.id || user.user_id || '',
    display_name: displayName,
    displayName,
  };
}

export function setStoredUser(user) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  cleanupLegacyStorage();
  const normalized = normalizeUser(user);
  if (normalized && (normalized.id || normalized.email)) {
    const raw = JSON.stringify(normalized);
    cachedUserRaw = raw;
    cachedUserParsed = normalized;
    localStorage.setItem(USER_STORAGE_KEY, raw);
  } else {
    cachedUserRaw = null;
    cachedUserParsed = null;
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  notifyAuthSubscribers();
}

export function setStoredAuth(data, maybeUser) {
  const user =
    maybeUser !== undefined
      ? maybeUser
      : data?.user !== undefined
        ? data.user
        : data?.id || data?.user_id || data?.email
          ? data
          : null;
  setStoredUser(user);
}

let meInFlightPromise = null;

export function clearStoredAuth() {
  meInFlightPromise = null;
  if (typeof window === 'undefined') return;
  cachedUserRaw = null;
  cachedUserParsed = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(OAUTH_FLOW_SESSION_KEY);
  }
  cleanupLegacyStorage();
  notifyAuthSubscribers();
}

export function isAuthenticated() {
  return Boolean(getStoredUser());
}

function subscribeAuth(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('kr0n-auth-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('kr0n-auth-change', callback);
    window.removeEventListener('storage', callback);
  };
}

const getServerSnapshot = () => null;

export function useAuthUser() {
  return useSyncExternalStore(subscribeAuth, getStoredUser, getServerSnapshot);
}

let apiClient = createApiClient({
  onUnauthorized: () => {
    clearStoredAuth();
  },
});

export function configureAuthTransport({ fetchImpl } = {}) {
  apiClient = createApiClient({
    fetchImpl,
    onUnauthorized: () => {
      clearStoredAuth();
    },
  });
}

export async function apiRequest(path, options = {}) {
  return apiClient.apiRequest(path, options);
}

export async function authFetch(path, options = {}) {
  return apiClient.apiRequest(path, {
    ...options,
    rawResponse: true,
  });
}

// ---------------------------------------------------------------------------
// 1. Registration & Login
// ---------------------------------------------------------------------------

export async function register(emailOrOptions, maybePassword, maybeDisplayName) {
  const email =
    typeof emailOrOptions === 'object' && emailOrOptions !== null
      ? emailOrOptions.email
      : emailOrOptions;
  const password =
    typeof emailOrOptions === 'object' && emailOrOptions !== null
      ? emailOrOptions.password
      : maybePassword;
  const displayName =
    typeof emailOrOptions === 'object' && emailOrOptions !== null
      ? emailOrOptions.displayName ?? emailOrOptions.display_name
      : maybeDisplayName;

  const nameCheck = validateDisplayNamePolicy(displayName);
  if (!nameCheck.valid) {
    throw new Error(nameCheck.error);
  }
  const passCheck = validatePasswordPolicy(password);
  if (!passCheck.valid) {
    throw new Error(passCheck.error);
  }

  return apiClient.apiRequest('/api/v1/auth/register', {
    method: 'POST',
    skipRefresh: true,
    body: {
      email: (email || '').trim(),
      password,
      display_name: displayName.trim(),
    },
  });
}

export async function login(emailOrOptions, maybePassword) {
  const email =
    typeof emailOrOptions === 'object' && emailOrOptions !== null
      ? emailOrOptions.email
      : emailOrOptions;
  const password =
    typeof emailOrOptions === 'object' && emailOrOptions !== null
      ? emailOrOptions.password
      : maybePassword;

  meInFlightPromise = null;
  const data = await apiClient.apiRequest('/api/v1/auth/login', {
    method: 'POST',
    skipRefresh: true,
    body: {
      email: (email || '').trim(),
      password,
    },
  });

  if (data?.user) {
    setStoredUser(data.user);
  }

  return data;
}

export async function logout() {
  meInFlightPromise = null;
  try {
    await apiClient.apiRequest('/api/v1/auth/logout', {
      method: 'POST',
      skipRefresh: true,
    });
  } catch {
    // Ignore transport errors during logout; local state is always cleared
  } finally {
    clearStoredAuth();
  }
}

export async function refreshTokens() {
  return apiClient.refreshSession();
}

// ---------------------------------------------------------------------------
// 2. Email Verification & User Profile
// ---------------------------------------------------------------------------

export async function verifyEmail(token) {
  return apiClient.apiRequest('/api/v1/auth/verify-email', {
    method: 'POST',
    skipRefresh: true,
    body: { token },
  });
}

export async function resendVerification(email) {
  return apiClient.apiRequest('/api/v1/auth/resend-verification', {
    method: 'POST',
    skipRefresh: true,
    body: { email: (email || '').trim() },
  });
}

export async function getMe({ force = false } = {}) {
  if (!force && meInFlightPromise) {
    return meInFlightPromise;
  }

  meInFlightPromise = (async () => {
    try {
      const data = await apiClient.apiRequest('/api/v1/me');
      if (data && (data.id || data.user_id || data.email)) {
        setStoredUser(data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  })().finally(() => {
    meInFlightPromise = null;
  });

  return meInFlightPromise;
}

// ---------------------------------------------------------------------------
// 3. Password Reset & Change
// ---------------------------------------------------------------------------

export async function requestPasswordReset(email) {
  return apiClient.apiRequest('/api/v1/auth/password-reset/request', {
    method: 'POST',
    skipRefresh: true,
    body: { email: (email || '').trim() },
  });
}

export async function confirmPasswordReset(token, newPassword) {
  const passCheck = validatePasswordPolicy(newPassword);
  if (!passCheck.valid) {
    throw new Error(passCheck.error);
  }

  return apiClient.apiRequest('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    skipRefresh: true,
    body: {
      token,
      new_password: newPassword,
    },
  });
}

export async function changePassword(currentPassword, newPassword) {
  const passCheck = validatePasswordPolicy(newPassword);
  if (!passCheck.valid) {
    throw new Error(passCheck.error);
  }

  return apiClient.apiRequest('/api/v1/auth/password/change', {
    method: 'POST',
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

// ---------------------------------------------------------------------------
// 4. OAuth (GitHub & Google)
// ---------------------------------------------------------------------------

function readStoredOAuthFlow() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(OAUTH_FLOW_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function consumeOAuthRedirect(fallback = '/dashboard') {
  const flow = readStoredOAuthFlow();
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(OAUTH_FLOW_SESSION_KEY);
  }
  return getSafeRedirect(flow?.redirect, fallback);
}

export async function startGitHubOAuth(options = {}) {
  return loginWithOAuth('github', options);
}

export async function loginWithOAuth(provider, options = {}) {
  const normalizedProvider = provider === 'google' ? 'google' : 'github';
  const safeRedirect = getSafeRedirect(options.redirect, '/dashboard');

  const data = await apiClient.apiRequest(`/api/v1/auth/${normalizedProvider}/start`, {
    method: 'GET',
    skipRefresh: true,
  });

  const authorizeUrl = data?.authorize_url || data?.auth_url || data?.url;
  if (!authorizeUrl) {
    throw new Error(`No authorize_url returned from ${normalizedProvider} OAuth start endpoint.`);
  }

  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(
      OAUTH_FLOW_SESSION_KEY,
      JSON.stringify({
        provider: normalizedProvider,
        state: data.state || null,
        codeVerifier: data.code_verifier || null,
        redirect: safeRedirect,
      })
    );
  }

  if (typeof window !== 'undefined') {
    window.location.href = authorizeUrl;
  }

  return data;
}

export async function completeOAuthCallback(provider, code, state) {
  if (!code) {
    throw new Error('Missing authorization code in OAuth callback.');
  }

  const storedFlow = readStoredOAuthFlow();
  const resolvedProvider =
    provider === 'google' || provider === 'github'
      ? provider
      : storedFlow?.provider === 'google'
        ? 'google'
        : 'github';

  if (storedFlow?.state && state && storedFlow.state !== state) {
    throw new Error('OAuth state mismatch. Please restart the login flow.');
  }

  const params = new URLSearchParams({ code });
  if (storedFlow?.codeVerifier) {
    params.set('code_verifier', storedFlow.codeVerifier);
  }
  if (state) {
    params.set('state', state);
  }

  const res = await apiClient.apiRequest(
    `/api/v1/auth/${resolvedProvider}/callback?${params.toString()}`,
    {
      method: 'GET',
      rawResponse: true,
      skipRefresh: true,
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw parseApiError(res.status, errData, `Failed to complete ${resolvedProvider} OAuth login.`);
  }

  const redirect = consumeOAuthRedirect('/dashboard');
  const user = await getMe({ force: true });
  if (!user) {
    throw new Error('Authentication cookies were not established by the OAuth provider.');
  }

  return { user, redirect };
}

// ---------------------------------------------------------------------------
// 5. Session Management
// ---------------------------------------------------------------------------

export async function getSessions() {
  const data = await apiClient.apiRequest('/api/v1/auth/sessions');
  return data?.sessions || [];
}

export async function revokeSession(sessionId) {
  return apiClient.apiRequest(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// 6. Organizations, Roles, Members, Invites, Tokens & Audit Logs
// ---------------------------------------------------------------------------

export async function getOrganizations() {
  const data = await apiClient.apiRequest('/api/v1/orgs');
  return data?.organizations || [];
}

export async function createOrganization(name, slug) {
  return apiClient.apiRequest('/api/v1/orgs', {
    method: 'POST',
    body: { name, slug },
  });
}

export async function getOrganization(orgId) {
  return apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}`);
}

export async function updateOrganization(orgId, name) {
  return apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}`, {
    method: 'PATCH',
    body: { name },
  });
}

export async function deleteOrganization(orgId) {
  return apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  });
}

export async function getRoles() {
  const data = await apiClient.apiRequest('/api/v1/roles');
  return data?.roles || [];
}

export async function getMembers(orgId) {
  const data = await apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}/members`);
  return data?.members || [];
}

export async function addMember(orgId, email, roleId = 'member') {
  return apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}/members`, {
    method: 'POST',
    body: { email: (email || '').trim(), role_id: roleId },
  });
}

export async function inviteMember(orgId, email, roleId = 'member') {
  return apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}/invites`, {
    method: 'POST',
    body: { email: (email || '').trim(), role_id: roleId },
  });
}

export async function updateMemberRole(orgId, targetUserId, roleId) {
  return apiClient.apiRequest(
    `/api/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(targetUserId)}`,
    {
      method: 'PATCH',
      body: { role_id: roleId },
    }
  );
}

export async function removeMember(orgId, targetUserId) {
  return apiClient.apiRequest(
    `/api/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(targetUserId)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function revokeInvite(orgId, inviteId) {
  return apiClient.apiRequest(
    `/api/v1/orgs/${encodeURIComponent(orgId)}/invites/${encodeURIComponent(inviteId)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function acceptInvite(token) {
  return apiClient.apiRequest('/api/v1/orgs/invites/accept', {
    method: 'POST',
    body: { token },
  });
}

export async function getApiTokens(orgId) {
  const data = await apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}/tokens`);
  return data?.tokens || [];
}

export async function createApiToken(
  orgId,
  name,
  permissions = ['project:read', 'service:read'],
  expiresInSeconds = 2592000
) {
  return apiClient.apiRequest(`/api/v1/orgs/${encodeURIComponent(orgId)}/tokens`, {
    method: 'POST',
    body: {
      name,
      permissions,
      expires_in_seconds: expiresInSeconds,
    },
  });
}

export async function revokeApiToken(orgId, tokenId) {
  return apiClient.apiRequest(
    `/api/v1/orgs/${encodeURIComponent(orgId)}/tokens/${encodeURIComponent(tokenId)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getAuditLogs(orgId, limitOrOptions = 50, maybeOffset = 0, maybeAction = '') {
  const isObj = typeof limitOrOptions === 'object' && limitOrOptions !== null;
  const limit = isObj ? (limitOrOptions.limit ?? 50) : limitOrOptions;
  const offset = isObj ? (limitOrOptions.offset ?? 0) : maybeOffset;
  const action = isObj ? (limitOrOptions.action ?? '') : maybeAction;

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (action) {
    query.set('action', action);
  }
  const data = await apiClient.apiRequest(
    `/api/v1/orgs/${encodeURIComponent(orgId)}/audit?${query.toString()}`
  );
  return data?.events || [];
}
