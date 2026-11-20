'use client';

import { configureGitHubAuth } from './github-api';

// Wire up auth tokens for GitHub integration API calls
if (typeof window !== 'undefined') {
  configureGitHubAuth(async () => {
    try {
      const raw = localStorage.getItem('kr0n_auth_tokens');
      if (raw) {
        const tokens = JSON.parse(raw);
        if (tokens?.accessToken) {
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

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const tokens = getStoredTokens();
  return !!(tokens && tokens.accessToken);
}

export function setStoredAuth(data) {
  if (typeof window === 'undefined') return;
  try {
    if (data.accessToken) {
      const expiresIn = data.expiresIn || 900;
      const tokensPayload = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || null,
        tokenType: data.tokenType || 'Bearer',
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokensPayload));
      // Store cookie for server-side route awareness
      document.cookie = `kr0n_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
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

async function requestAuth(path, options = {}) {
  const backendUrl = getBackendUrl().replace(/\/+$/, '');
  const url = `${backendUrl}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : null;

    if (!res.ok) {
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
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
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
  if (tokens?.refreshToken) {
    try {
      await requestAuth('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });
    } catch (err) {
      console.warn('[kr0n-auth] Server-side logout notice:', err?.message);
    }
  }
  clearStoredAuth();
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

/**
 * Fetch authenticated user profile.
 */
export async function getMe() {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) return null;

  return await requestAuth('/api/v1/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
}

/**
 * List active user sessions.
 */
export async function getSessions() {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) return [];

  const data = await requestAuth('/api/v1/auth/sessions', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  return data?.sessions || [];
}

/**
 * Revoke an active session.
 */
export async function revokeSession(sessionId) {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    throw new Error('Authentication required');
  }

  return await requestAuth(`/api/v1/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
}

/**
 * Change current user password.
 */
export async function changePassword(currentPassword, newPassword) {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    throw new Error('Authentication required');
  }

  return await requestAuth('/api/v1/auth/password/change', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
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
    throw new Error(
      'Google OAuth is not implemented on the backend. The control plane currently supports GitHub OAuth and Email/Password authentication.'
    );
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
