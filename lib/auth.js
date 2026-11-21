'use client';

import { useSyncExternalStore } from 'react';
import { configureGitHubAuth } from './github-api';

// Wire up auth tokens for GitHub integration API calls
if (typeof window !== 'undefined') {
  configureGitHubAuth(async () => {
    try {
      const raw = localStorage.getItem('kr0n_auth_tokens');
      if (raw) {
        const tokens = JSON.parse(raw);
        if (tokens?.accessToken && tokens.accessToken !== 'cookie-session') {
          return { Authorization: `Bearer ${tokens.accessToken}` };
        }
      }
    } catch {
      // Ignore token retrieval errors
    }
    return {};
  });
}

// ─── AUTH CONFIGURATION & ENV HELPERS ───────────────────────────────

export function getBackendUrl() {
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8080'
    );
  }
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080'
  );
}

export function getRedirectUrl() {
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_REDIRECT_URL ||
      process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
      `${window.location.origin}/callback`
    );
  }
  return (
    process.env.REDIRECT_URL ||
    process.env.NEXT_PUBLIC_REDIRECT_URL ||
    'http://localhost:3000/callback'
  );
}

// ─── STORAGE & COOKIE HELPERS ───────────────────────────────────────

const AUTH_STORAGE_KEY = 'kr0n_auth_tokens';
const AUTH_USER_KEY = 'kr0n_auth_user';

export function getStoredTokens() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let cachedUser = null;
let cachedUserRaw = null;

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      cachedUser = null;
      cachedUserRaw = null;
      return null;
    }
    if (raw === cachedUserRaw) {
      return cachedUser;
    }
    cachedUserRaw = raw;
    cachedUser = JSON.parse(raw);
    return cachedUser;
  } catch {
    cachedUser = null;
    cachedUserRaw = null;
    return null;
  }
}

function subscribeAuth(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('kr0n_auth_change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('kr0n_auth_change', callback);
    window.removeEventListener('storage', callback);
  };
}

const getClientAuthSnapshot = () => getStoredUser();
const getServerAuthSnapshot = () => null;

export function useAuthUser() {
  return useSyncExternalStore(subscribeAuth, getClientAuthSnapshot, getServerAuthSnapshot);
}

export function isAuthenticated() {
  const user = getStoredUser();
  const tokens = getStoredTokens();
  return !!(user || (tokens && tokens.accessToken));
}

export function setStoredAuth(data) {
  if (typeof window === 'undefined') return;
  try {
    const accessToken = data.accessToken || (data.user ? 'cookie-session' : null);
    if (accessToken) {
      const expiresIn = data.expiresIn || 900;
      const tokensPayload = {
        accessToken,
        refreshToken: data.refreshToken || null,
        tokenType: data.tokenType || 'Bearer',
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokensPayload));
      // Store cookie for server-side route awareness if raw JWT available
      if (accessToken !== 'cookie-session') {
        document.cookie = `kr0n_token=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax`;
      }
    }

    if (data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      document.cookie = `kr0n_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=604800; SameSite=Lax`;
    }

    // Trigger local listeners
    window.dispatchEvent(new Event('kr0n_auth_change'));
  } catch (err) {
    console.error('[kr0n-auth] Failed to persist auth session', err);
  }
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    document.cookie = 'kr0n_token=; path=/; max-age=-1; SameSite=Lax';
    document.cookie = 'kr0n_user=; path=/; max-age=-1; SameSite=Lax';
    window.dispatchEvent(new Event('kr0n_auth_change'));
  } catch (err) {
    console.error('[kr0n-auth] Failed to clear auth session', err);
  }
}

// ─── API REQUEST WRAPPER ────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];

async function requestAuth(path, options = {}, isRetry = false) {
  const isBrowser = typeof window !== 'undefined';
  const backendUrl = isBrowser ? '' : getBackendUrl().replace(/\/+$/, '');
  const url = `${backendUrl}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : null;

    if (!res.ok) {
      // Auto-refresh token on 401 Unauthorized for API endpoints
      if (
        res.status === 401 &&
        !isRetry &&
        isBrowser &&
        !path.includes('/api/v1/auth/login') &&
        !path.includes('/api/v1/auth/refresh') &&
        !path.includes('/api/v1/auth/register')
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const tokens = getStoredTokens();
            const refreshRes = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: tokens?.refreshToken || '' }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json().catch(() => ({}));
              if (refreshData?.access_token) {
                setStoredAuth({
                  ...tokens,
                  accessToken: refreshData.access_token,
                  refreshToken: refreshData.refresh_token || tokens?.refreshToken,
                  expiresIn: refreshData.expires_in || 900,
                });
              }
              isRefreshing = false;
              refreshQueue.forEach((cb) => cb(null));
              refreshQueue = [];

              const retryHeaders = {
                ...options.headers,
                ...getAuthHeaders(),
              };
              return await requestAuth(path, { ...options, headers: retryHeaders }, true);
            } else {
              isRefreshing = false;
              refreshQueue.forEach((cb) => cb(new Error('Session expired')));
              refreshQueue = [];
              clearStoredAuth();
            }
          } catch (refreshErr) {
            isRefreshing = false;
            refreshQueue.forEach((cb) => cb(refreshErr));
            refreshQueue = [];
            clearStoredAuth();
          }
        } else {
          return new Promise((resolve, reject) => {
            refreshQueue.push(async (err) => {
              if (err) {
                reject(err);
              } else {
                try {
                  const retryHeaders = {
                    ...options.headers,
                    ...getAuthHeaders(),
                  };
                  resolve(await requestAuth(path, { ...options, headers: retryHeaders }, true));
                } catch (retryErr) {
                  reject(retryErr);
                }
              }
            });
          });
        }
      }

      let message = (data && (data.error || data.message)) || `HTTP ${res.status}`;

      if (res.status === 401 && !message) {
        message = 'Invalid email or password';
      } else if (res.status === 409 && !message) {
        message = 'Email is already registered';
      } else if (res.status === 403 && !message) {
        message = 'Access denied. Account is inactive or unverified.';
      } else if (res.status === 503 && !message) {
        message = 'Authentication service is temporarily unavailable.';
      }

      const error = new Error(message);
      error.status = res.status;
      error.code = data?.code;
      error.data = data;
      throw error;
    }

    return data || {};
  } catch (err) {
    if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('network'))) {
      const connErr = new Error(
        `Unable to reach KR0N control-plane at ${backendUrl}. Please ensure the backend gateway is running.`
      );
      connErr.code = 'NETWORK_UNREACHABLE';
      throw connErr;
    }
    throw err;
  }
}

// ─── AUTHENTICATION ACTIONS ─────────────────────────────────────────

/**
 * Log in with email and password.
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const data = await requestAuth('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const authPayload = {
    accessToken: data.access_token || 'cookie-session',
    refreshToken: data.refresh_token || null,
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in || 900,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.display_name || data.user.email.split('@')[0],
          status: data.user.status,
        }
      : { email: email.trim().toLowerCase() },
  };

  setStoredAuth(authPayload);
  return authPayload;
}

/**
 * Register a new user account.
 */
export async function register(email, password, displayName) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const data = await requestAuth('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      display_name: displayName?.trim() || '',
    }),
  });

  return {
    userId: data.user_id,
    email: data.email,
    displayName: data.display_name,
    status: data.status,
    createdAt: data.created_at,
  };
}

/**
 * Log out current user session.
 */
export async function logout() {
  const tokens = getStoredTokens();
  try {
    await requestAuth('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: tokens?.refreshToken || '' }),
    });
  } catch (err) {
    console.warn('[kr0n-auth] Server-side logout notice:', err?.message);
  } finally {
    clearStoredAuth();
  }
}

/**
 * Refresh access token using stored refresh token.
 */
export async function refreshTokens() {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const data = await requestAuth('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  });

  const updated = {
    ...tokens,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokens.refreshToken,
    tokenType: data.token_type || tokens.tokenType || 'Bearer',
    expiresIn: data.expires_in || 900,
    expiresAt: Date.now() + (data.expires_in || 900) * 1000,
  };

  setStoredAuth(updated);
  return updated;
}

/**
 * Request password reset token via email.
 */
export async function requestPasswordReset(email) {
  if (!email) {
    throw new Error('Email is required');
  }
  return await requestAuth('/api/v1/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/**
 * Confirm password reset with token and new password.
 */
export async function confirmPasswordReset(token, newPassword) {
  if (!token || !newPassword) {
    throw new Error('Token and new password are required');
  }
  return await requestAuth('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({
      token: token.trim(),
      new_password: newPassword,
    }),
  });
}

/**
 * Verify user email with token.
 */
export async function verifyEmail(token) {
  if (!token) {
    throw new Error('Verification token is required');
  }
  return await requestAuth('/api/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: token.trim() }),
  });
}

/**
 * Resend email verification token.
 */
export async function resendVerification(email) {
  if (!email) {
    throw new Error('Email is required');
  }
  return await requestAuth('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

let meInFlightPromise = null;

/**
 * Fetch authenticated user profile.
 */
export async function getMe() {
  if (meInFlightPromise) return meInFlightPromise;

  meInFlightPromise = (async () => {
    try {
      const headers = getAuthHeaders();
      const data = await requestAuth('/api/v1/me', {
        method: 'GET',
        headers,
      });
      if (data && (data.id || data.email || data.user_id || data.userId)) {
        setStoredAuth({ user: data });
        return data;
      }
      return null;
    } catch (err) {
      if (err?.status === 401 || err?.message?.includes('UNAUTHORIZED') || err?.message?.includes('authentication required')) {
        clearStoredAuth();
        return null;
      }
      return getStoredUser() || null;
    } finally {
      setTimeout(() => {
        meInFlightPromise = null;
      }, 1500);
    }
  })();

  return meInFlightPromise;
}

/**
 * List active user sessions.
 */
export async function getSessions() {
  if (!isAuthenticated()) return [];

  const headers = getAuthHeaders();
  try {
    const data = await requestAuth('/api/v1/auth/sessions', {
      method: 'GET',
      headers,
    });
    return data?.sessions || [];
  } catch {
    return [];
  }
}

/**
 * Revoke an active session.
 */
export async function revokeSession(sessionId) {
  if (!isAuthenticated() || !sessionId) {
    throw new Error('Authentication and Session ID required');
  }

  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * Change current user password.
 */
export async function changePassword(currentPassword, newPassword) {
  if (!isAuthenticated()) {
    throw new Error('Authentication required');
  }

  const headers = getAuthHeaders();
  return await requestAuth('/api/v1/auth/password/change', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

/**
 * Start GitHub OAuth flow safely.
 */
export async function startGitHubOAuth() {
  return await loginWithOAuth('github');
}

/**
 * Log in with social identity provider (GitHub or Google).
 * Redirects to live OAuth provider when configured, or provides clear
 * diagnostic errors when credentials have not been configured.
 */
export async function loginWithOAuth(provider) {
  const backendUrl = getBackendUrl().replace(/\/+$/, '');

  if (provider === 'github') {
    const startUrl = `${backendUrl}/api/v1/auth/github/start`;

    try {
      const res = await fetch(startUrl, {
        method: 'GET',
        credentials: 'include',
      });

      // If backend returns an error (e.g. 400 FAILED_PRECONDITION or 503)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error?.includes('not configured') || data.code === 'FAILED_PRECONDITION') {
          throw new Error(
            'GitHub OAuth is not configured on the backend. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET from your GitHub App into kr0n-backend/control-plane/.env.'
          );
        }
        throw new Error(data.error || `GitHub OAuth initialization failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.authorize_url) {
        throw new Error('No authorization URL returned from GitHub OAuth initialization.');
      }

      // Store PKCE code_verifier and state so callback handler can complete exchange
      if (typeof window !== 'undefined') {
        if (data.code_verifier) {
          sessionStorage.setItem('kr0n_oauth_code_verifier', data.code_verifier);
          localStorage.setItem('kr0n_oauth_code_verifier', data.code_verifier);
        }
        if (data.state) {
          sessionStorage.setItem('kr0n_oauth_state', data.state);
        }
      }

      // GitHub Apps do not support dynamic scopes; remove 'scope' parameter to avoid GitHub 404
      let targetAuthUrl = data.authorize_url;
      try {
        const parsed = new URL(data.authorize_url);
        parsed.searchParams.delete('scope');
        targetAuthUrl = parsed.toString();
      } catch {
        targetAuthUrl = data.authorize_url.replace(/([?&])scope=[^&]*(&|$)/, (m, p1, p2) => (p2 === '&' ? p1 : ''));
      }

      // Navigate browser to GitHub authorization page
      window.location.assign(targetAuthUrl);
      return { type: 'redirect' };
    } catch (err) {
      if (err.message && err.message.includes('GitHub OAuth')) {
        throw err;
      }
      throw new Error(err.message || 'Unable to connect to GitHub OAuth service.');
    }
  }

  if (provider === 'google') {
    const startUrl = `${backendUrl}/api/v1/auth/google/start`;

    try {
      const res = await fetch(startUrl, {
        method: 'GET',
        credentials: 'include',
      });

      // If backend returns an error (e.g. 400 FAILED_PRECONDITION or 503)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error?.includes('not configured') || data.code === 'FAILED_PRECONDITION') {
          throw new Error(
            'Google OAuth credentials are not configured on the backend server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to kr0n-backend/.env.'
          );
        }
        throw new Error(data.error || `Google OAuth initialization failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.authorize_url) {
        throw new Error('No authorization URL returned from Google OAuth initialization.');
      }

      // Store PKCE code_verifier and state so callback handler can complete exchange
      if (typeof window !== 'undefined') {
        if (data.code_verifier) {
          sessionStorage.setItem('kr0n_google_oauth_code_verifier', data.code_verifier);
          localStorage.setItem('kr0n_google_oauth_code_verifier', data.code_verifier);
        }
        if (data.state) {
          sessionStorage.setItem('kr0n_google_oauth_state', data.state);
        }
      }

      // Navigate browser to Google authorization page
      window.location.assign(data.authorize_url);
      return { type: 'redirect' };
    } catch (err) {
      if (err.message && err.message.includes('Google OAuth')) {
        throw err;
      }
      throw new Error(err.message || 'Unable to connect to Google OAuth service.');
    }
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

// ─── AUTH HEADERS HELPER ────────────────────────────────────────────

export function getAuthHeaders() {
  const tokens = getStoredTokens();
  const headers = {};
  if (tokens?.accessToken && tokens.accessToken !== 'cookie-session') {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  return headers;
}

// ─── ORGANIZATIONS & RBAC ───────────────────────────────────────────

/**
 * List all organizations the user belongs to.
 */
export async function getOrganizations() {
  if (!isAuthenticated()) {
    const me = await getMe();
    if (!me) return [];
  }
  const headers = getAuthHeaders();
  try {
    const data = await requestAuth('/api/v1/orgs', {
      method: 'GET',
      headers,
    });
    return data?.organizations || [];
  } catch (err) {
    console.warn('[kr0n-auth] Failed to fetch organizations:', err?.message);
    return [];
  }
}

/**
 * Create a new organization workspace.
 */
export async function createOrganization(name, slug) {
  if (!isAuthenticated()) {
    const me = await getMe();
    if (!me) throw new Error('Authentication required');
  }
  const headers = getAuthHeaders();
  const cleanName = (name || 'My Workspace').trim();
  const cleanSlug = (slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).toLowerCase();
  return await requestAuth('/api/v1/orgs', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: cleanName, slug: cleanSlug }),
  });
}

/**
 * Get organization metadata by ID.
 */
export async function getOrganization(orgId) {
  if (!isAuthenticated() || !orgId) return null;
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}`, {
    method: 'GET',
    headers,
  });
}

/**
 * Update organization display name.
 */
export async function updateOrganization(orgId, name) {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: name.trim() }),
  });
}

/**
 * Delete an organization workspace (requires Owner role).
 */
export async function deleteOrganization(orgId) {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * List RBAC roles and permissions catalog.
 */
export async function getRoles() {
  const headers = getAuthHeaders();
  try {
    const data = await requestAuth('/api/v1/roles', {
      method: 'GET',
      headers,
    });
    return data?.roles || [];
  } catch {
    return [];
  }
}

// ─── ORGANIZATION MEMBERS & INVITES ─────────────────────────────────

/**
 * List members of an organization.
 */
export async function getMembers(orgId) {
  if (!isAuthenticated() || !orgId) return [];
  const headers = getAuthHeaders();
  try {
    const data = await requestAuth(`/api/v1/orgs/${orgId}/members`, {
      method: 'GET',
      headers,
    });
    return data?.members || [];
  } catch (err) {
    console.warn('[kr0n-auth] Failed to fetch members:', err?.message);
    return [];
  }
}

/**
 * Create an email invitation to an organization.
 */
export async function inviteMember(orgId, email, roleId = 'member') {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}/invites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      role_id: roleId.toLowerCase(),
    }),
  });
}

/**
 * Update an existing member's role in an organization.
 */
export async function updateMemberRole(orgId, targetUserId, roleId) {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}/members/${targetUserId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role_id: roleId.toLowerCase() }),
  });
}

/**
 * Remove a member from an organization.
 */
export async function removeMember(orgId, targetUserId) {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}/members/${targetUserId}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * Accept an organization invitation token.
 */
export async function acceptInvite(token) {
  if (!token) throw new Error('Invite Token required');
  const headers = getAuthHeaders();
  return await requestAuth('/api/v1/orgs/invites/accept', {
    method: 'POST',
    headers,
    body: JSON.stringify({ token: token.trim() }),
  });
}

/**
 * Revoke a pending organization invitation.
 */
export async function revokeInvite(orgId, inviteId) {
  if (!isAuthenticated() || !orgId || !inviteId) throw new Error('Authentication, Organization ID, and Invite ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}/invites/${inviteId}`, {
    method: 'DELETE',
    headers,
  });
}

// ─── API TOKENS (kr0n_pat_...) ───────────────────────────────────────

/**
 * List active API tokens for an organization.
 */
export async function getApiTokens(orgId) {
  if (!isAuthenticated() || !orgId) return [];
  const headers = getAuthHeaders();
  try {
    const data = await requestAuth(`/api/v1/orgs/${orgId}/tokens`, {
      method: 'GET',
      headers,
    });
    return data?.tokens || [];
  } catch (err) {
    console.warn('[kr0n-auth] Failed to fetch API tokens:', err?.message);
    return [];
  }
}

/**
 * Create a new Personal Access Token for an organization.
 */
export async function createApiToken(
  orgId,
  name,
  permissions = ['project:read', 'service:read'],
  expiresInSeconds = 2592000
) {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}/tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: name.trim(),
      permissions,
      expires_in_seconds: expiresInSeconds,
    }),
  });
}

/**
 * Revoke an API token for an organization.
 */
export async function revokeApiToken(orgId, tokenId) {
  if (!isAuthenticated() || !orgId) throw new Error('Authentication and Organization ID required');
  const headers = getAuthHeaders();
  return await requestAuth(`/api/v1/orgs/${orgId}/tokens/${tokenId}`, {
    method: 'DELETE',
    headers,
  });
}

// ─── SECURITY AUDIT LOGS ────────────────────────────────────────────

/**
 * List append-only audit events for an organization.
 */
export async function getAuditLogs(orgId, limit = 50, offset = 0) {
  if (!isAuthenticated() || !orgId) return [];
  const headers = getAuthHeaders();
  try {
    const data = await requestAuth(`/api/v1/orgs/${orgId}/audit?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers,
    });
    return data?.events || [];
  } catch (err) {
    console.warn('[kr0n-auth] Failed to fetch audit events:', err?.message);
    return [];
  }
}
